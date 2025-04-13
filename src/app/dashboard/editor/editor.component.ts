import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { Subscription, take, tap, firstValueFrom } from 'rxjs';
import { FileSystemService } from '../../services/file-system.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit, AfterViewInit {
  @ViewChild('previewFrame') previewFrame!: ElementRef;

  currentView: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  previewScale = 1;
  isMobileScreen = false;
  isAuthenticated = false;
  currentUser: any = null;

  // Panel states
  isCollapsed = false;
  isSidebarActive = false;

  // Design generation states
  prompt = '';
  generatedDesign: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];
  private resizeObserver: ResizeObserver;

  // HTML Code Viewer Modal
  isHtmlModalOpen = false;
  htmlContent = '';
  clipboardCopySuccess = false;
  isHtmlLoading = false;
  formattedHtml: SafeHtml | null = null;

  constructor(
    private authService: AuthService,
    private fileSystemService: FileSystemService,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.currentView !== 'desktop') {
        this.adjustPreviewScale();
      }
    });

    // Subscribe to auth state using the Observable
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        if (!user) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
          });
        }
      })
    );
  }

  ngOnInit() {
    // Use the Observable for authentication check
    this.authService.isAuthenticated$
      .pipe(
        take(1),
        tap((isAuth) => {
          if (!isAuth) {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: this.router.url },
            });
            return;
          }
          this.setInitialView();
          this.setupResizeListener();
        })
      )
      .subscribe();
  }

  private setupResizeListener() {
    const handleResize = () => this.handleResize();
    window.addEventListener('resize', handleResize);
    // Store the handler reference for cleanup
    this.subscriptions.push(
      new Subscription(() => {
        window.removeEventListener('resize', handleResize);
      })
    );
  }

  async saveProject() {
    if (!this.isAuthenticated || !this.generatedDesign) {
      if (!this.isAuthenticated) {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url },
        });
      }
      return;
    }

    try {
      const projectId = await this.fileSystemService.createNode({
        name: 'index.html',
        type: 'file',
        parentId: 'root',
        content: this.generatedDesign,
      });

      // Show success message or handle the response
    } catch (error) {
      console.error('Error saving project:', error);
      // Handle error appropriately
    }
  }

  private setInitialView() {
    if (window.innerWidth < 640) {
      this.currentView = 'mobile';
      this.isMobileScreen = true;
    }
  }

  renderDesign() {
    if (!this.generatedDesign) {
      console.warn('No design content to render');
      return;
    }

    const iframe = this.previewFrame?.nativeElement as HTMLIFrameElement;
    if (!iframe) {
      console.error('Preview iframe not found');
      return;
    }

    try {
      if (iframe.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write(this.generatedDesign);
        iframe.contentDocument.close();
        console.log('Design rendered successfully in preview');
      } else {
        console.error('Could not access iframe contentDocument');
      }
    } catch (error) {
      console.error('Error rendering design in preview:', error);
      this.errorMessage =
        'Error displaying the generated design. Please try again.';
    }
  }

  private adjustPreviewScale() {
    // Add your scaling logic here if needed
  }

  ngAfterViewInit() {
    const previewWrapper = document.querySelector('.preview-wrapper');
    if (previewWrapper) {
      this.resizeObserver.observe(previewWrapper);
    }
    this.adjustPreviewScale();
  }

  // View HTML Code in a Modal
  viewHtmlCode() {
    if (!this.generatedDesign) {
      this.errorMessage = 'No HTML content available to view';
      return;
    }

    this.isHtmlLoading = true;
    this.htmlContent = this.generatedDesign;
    this.isHtmlModalOpen = true;

    // Simulate loading delay for better UX when handling large content
    setTimeout(() => {
      this.formattedHtml = this.sanitizer.bypassSecurityTrustHtml(
        this.formatHtmlContent()
      );
      this.isHtmlLoading = false;
    }, 100);
  }

  // Copy HTML to clipboard
  copyHtmlToClipboard() {
    if (!this.htmlContent) {
      this.errorMessage = 'No HTML content available to copy';
      return;
    }

    navigator.clipboard
      .writeText(this.htmlContent)
      .then(() => {
        this.clipboardCopySuccess = true;
        // Hide the success message after 2 seconds
        setTimeout(() => {
          this.clipboardCopySuccess = false;
        }, 2000);
      })
      .catch((err) => {
        console.error('Error copying text to clipboard:', err);
        this.errorMessage = 'Failed to copy to clipboard';
      });
  }

  // Format HTML content with basic syntax highlighting
  formatHtmlContent(): string {
    if (!this.htmlContent) return '';

    // Escape HTML to prevent XSS
    let escaped = this.htmlContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Insert word-break opportunities before and after these characters
    escaped = escaped.replace(/([>,])/g, '$1<wbr>');

    // Basic syntax highlighting with optimized regex
    let highlighted = escaped
      // HTML tags
      .replace(
        /&lt;(\/?[a-zA-Z][a-zA-Z0-9]*)(.*?)&gt;/g,
        '<span class="text-orange-400">&lt;$1</span><span class="text-blue-400">$2</span><span class="text-orange-400">&gt;</span>'
      )
      // Attributes
      .replace(
        /(\s+)([a-zA-Z0-9_-]+)=/g,
        '$1<span class="text-green-400">$2</span>='
      )
      // Attribute values
      .replace(
        /=&quot;(.*?)&quot;/g,
        '=&quot;<span class="text-yellow-300">$1</span>&quot;'
      )
      // Comments
      .replace(
        /&lt;!--(.*?)--&gt;/g,
        '<span class="text-gray-500">&lt;!--$1--&gt;</span>'
      );

    return highlighted;
  }

  // Open in Full Screen
  openFullScreen() {
    if (!this.generatedDesign) {
      this.errorMessage = 'No content available for full screen view';
      return;
    }

    // Create a new window with the content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(this.generatedDesign);
      newWindow.document.close();
    } else {
      this.errorMessage =
        'Unable to open full screen view. Please check your popup blocker settings.';
    }
  }

  // Download HTML
  downloadHtml() {
    if (!this.generatedDesign) {
      this.errorMessage = 'No HTML content available to download';
      return;
    }

    const blob = new Blob([this.generatedDesign], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.style.display = 'none';
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.resizeObserver.disconnect();
  }

  toggleSidebar() {
    this.isSidebarActive = !this.isSidebarActive;
  }

  private handleResize() {
    const isMobile = window.innerWidth < 640;
    if (isMobile && !this.isMobileScreen) {
      this.isMobileScreen = true;
      this.currentView = 'mobile';
      this.renderDesign();
    } else if (!isMobile && this.isMobileScreen) {
      this.isMobileScreen = false;
    }

    if (window.innerWidth >= 768) {
      this.isSidebarActive = false;
    }
    if (this.currentView !== 'desktop') {
      this.adjustPreviewScale();
    }
  }

  toggleView(view: 'desktop' | 'tablet' | 'mobile') {
    if (this.isMobileScreen && view !== 'mobile') {
      return;
    }
    this.currentView = view;
    setTimeout(() => {
      this.adjustPreviewScale();
      this.refreshPreview();
    }, 100);
  }

  refreshPreview() {
    this.renderDesign();
  }

  async generateDesign() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (!this.prompt.trim()) {
      this.errorMessage = 'Please enter a prompt for the design generation';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      console.log('Generating design for prompt:', this.prompt);
      if (environment.production) {
        this.generatedDesign = await this.callGenerationAPI(this.prompt);
      } else {
        this.generatedDesign = this.provideGeneratedDesignExample();
      }
      console.log('Design generated successfully');

      // Render the design in the preview
      setTimeout(() => {
        this.renderDesign();
      }, 100);
    } catch (error) {
      console.error('Design generation error:', error);

      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          this.errorMessage = 'Authentication error. Please sign in again.';
        } else if (error.message.includes('Failed to generate')) {
          this.errorMessage =
            'The AI service failed to generate a design. Please try a different prompt.';
        } else {
          this.errorMessage = error.message;
        }
      } else {
        this.errorMessage = 'Failed to generate design. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private async callGenerationAPI(prompt: string): Promise<string> {
    // Update the payload to match what the API expects
    const payload = {
      prompt: prompt,
      existingHtml: this.generatedDesign || '',
    };

    try {
      // Get the current authentication token
      const token = await firstValueFrom(this.authService.getIdToken());
      console.log('Got authentication token, making API request...');

      if (!token) {
        throw new Error('Authentication token not available');
      }

      console.log('Sending request to API with payload:', payload);

      const response = await firstValueFrom(
        this.http.post<{ completion: string }>(
          `${environment.apiUrl}/AI/chatv1`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      console.log('Received API response:', response);

      // Extract the HTML content from the completion field
      if (response?.completion) {
        console.log('HTML content extracted successfully');
        return response.completion;
      } else {
        console.error('API response missing completion field:', response);
        throw new Error('Failed to generate design');
      }
    } catch (error: any) {
      console.error('API Error:', error);

      // Log detailed error information
      if (error.status) {
        console.error(
          `HTTP Status: ${error.status}, Status Text: ${error.statusText}`
        );
      }
      if (error.error) {
        console.error('Error response body:', error.error);
      }

      if (error instanceof Error && error.message.includes('Authentication')) {
        // Handle auth errors
        this.authService.handleAuthError().then(() => {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
          });
        });
        throw new Error('Authentication error. Please sign in again.');
      }
      throw new Error('Error generating design');
    }
  }

  provideGeneratedDesignExample(): string {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>AI Platform | Future of Intelligence</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">\n    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n    <style>\n        body {\n            font-family: \'Space Grotesk\', sans-serif;\n            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n        }\n        .gradient-text {\n            background: linear-gradient(90deg, #38bdf8, #818cf8);\n            -webkit-background-clip: text;\n            -webkit-text-fill-color: transparent;\n        }\n        .floating {\n            animation: float 6s ease-in-out infinite;\n        }\n        @keyframes float {\n            0% { transform: translateY(0px); }\n            50% { transform: translateY(-20px); }\n            100% { transform: translateY(0px); }\n        }\n        .glow {\n            box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);\n        }\n    </style>\n</head>\n<body class="text-gray-100 min-h-screen">\n    <nav class="container mx-auto px-6 py-4">\n        <div class="flex justify-between items-center">\n            <div class="text-2xl font-bold gradient-text">AI.Platform</div>\n            <div class="hidden md:flex space-x-8">\n                <a href="#features" class="hover:text-blue-400 transition">Features</a>\n                <a href="#how-to" class="hover:text-blue-400 transition">How to Use</a>\n                <a href="#demo" class="hover:text-blue-400 transition">Demo</a>\n            </div>\n        </div>\n    </nav>\n\n    <main class="container mx-auto px-6">\n        <!-- Hero Section -->\n        <section class="py-20 text-center">\n            <div class="max-w-4xl mx-auto">\n                <h1 class="text-5xl md:text-7xl font-bold mb-8 gradient-text">\n                    The Future of AI is Here\n                </h1>\n                <p class="text-xl text-gray-300 mb-12">\n                    Transform your workflow with state-of-the-art artificial intelligence. \n                    Experience the power of next-generation machine learning.\n                </p>\n                <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 glow">\n                    Get Started Now\n                </button>\n            </div>\n        </section>\n\n        <!-- Demo Video Section -->\n        <section id="demo" class="py-20">\n            <div class="max-w-4xl mx-auto bg-slate-800/50 rounded-2xl p-8 backdrop-blur-sm">\n                <h2 class="text-3xl font-bold mb-8 text-center gradient-text">See AI.Platform in Action</h2>\n                <div class="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl">\n                    <video class="w-full rounded-xl" controls poster="https://images.unsplash.com/photo-1673194112431-14530ce9b0e5?auto=format&fit=crop&q=80">\n                        <source src="#" type="video/mp4">\n                        Your browser does not support the video tag.\n                    </video>\n                </div>\n            </div>\n        </section>\n\n        <!-- How to Use Section -->\n        <section id="how-to" class="py-20">\n            <h2 class="text-3xl font-bold mb-16 text-center gradient-text">How to Use AI.Platform</h2>\n            <div class="grid md:grid-cols-3 gap-12">\n                <div class="bg-slate-800/30 p-8 rounded-2xl backdrop-blur-sm floating">\n                    <div class="text-5xl mb-4 text-blue-400"><i class="bi bi-1-circle"></i></div>\n                    <h3 class="text-xl font-bold mb-4">Sign Up</h3>\n                    <p class="text-gray-300">Create your account in seconds and get immediate access to our AI tools.</p>\n                </div>\n                <div class="bg-slate-800/30 p-8 rounded-2xl backdrop-blur-sm floating" style="animation-delay: 0.2s">\n                    <div class="text-5xl mb-4 text-blue-400"><i class="bi bi-2-circle"></i></div>\n                    <h3 class="text-xl font-bold mb-4">Upload Your Data</h3>\n                    <p class="text-gray-300">Simply drag and drop your files or integrate with our API.</p>\n                </div>\n                <div class="bg-slate-800/30 p-8 rounded-2xl backdrop-blur-sm floating" style="animation-delay: 0.4s">\n                    <div class="text-5xl mb-4 text-blue-400"><i class="bi bi-3-circle"></i></div>\n                    <h3 class="text-xl font-bold mb-4">Get Results</h3>\n                    <p class="text-gray-300">Watch as our AI processes your data and delivers insights in real-time.</p>\n                </div>\n            </div>\n        </section>\n\n        <!-- Features Section -->\n        <section id="features" class="py-20">\n            <div class="max-w-4xl mx-auto text-center">\n                <h2 class="text-3xl font-bold mb-16 gradient-text">Advanced Features</h2>\n                <div class="grid md:grid-cols-2 gap-8">\n                    <div class="bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition">\n                        <i class="bi bi-cpu text-4xl text-blue-400"></i>\n                        <h3 class="text-xl font-bold my-4">Neural Processing</h3>\n                        <p class="text-gray-300">Advanced neural networks for complex computations</p>\n                    </div>\n                    <div class="bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition">\n                        <i class="bi bi-graph-up text-4xl text-blue-400"></i>\n                        <h3 class="text-xl font-bold my-4">Real-time Analytics</h3>\n                        <p class="text-gray-300">Instant insights and data visualization</p>\n                    </div>\n                    <div class="bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition">\n                        <i class="bi bi-shield-check text-4xl text-blue-400"></i>\n                        <h3 class="text-xl font-bold my-4">Secure Processing</h3>\n                        <p class="text-gray-300">Enterprise-grade security protocols</p>\n                    </div>\n                    <div class="bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition">\n                        <i class="bi bi-cloud-arrow-up text-4xl text-blue-400"></i>\n                        <h3 class="text-xl font-bold my-4">Cloud Integration</h3>\n                        <p class="text-gray-300">Seamless cloud storage and processing</p>\n                    </div>\n                </div>\n            </div>\n        </section>\n    </main>\n\n    <footer class="container mx-auto px-6 py-8 text-center text-gray-400">\n        <p>© 2023 AI.Platform. All rights reserved.</p>\n    </footer>\n</body>\n</html>';
  }
}
