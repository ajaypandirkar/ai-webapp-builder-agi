import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { Subscription, take, tap, firstValueFrom, catchError } from 'rxjs';
import { FileSystemService } from '../../services/file-system.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuotaService, QuotaStatus } from '../../services/quota.service';

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

  // Quota states
  quotaStatus: QuotaStatus | null = null;
  isQuotaLoading = false;
  quotaError: string | null = null;

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
    private sanitizer: DomSanitizer,
    private quotaService: QuotaService
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
          this.fetchQuotaStatus();
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
    if (!this.prompt) {
      this.errorMessage = 'Please enter a prompt for the design';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;

    // First check quota status
    try {
      await this.fetchQuotaStatus(true);

      if (this.quotaStatus && !this.quotaStatus.canGenerate) {
        this.isLoading = false;
        // Redirect to plans page when quota is exhausted
        this.router.navigate(['/plans'], {
          queryParams: {
            reason: 'quota_exceeded',
            returnUrl: this.router.url,
          },
        });
        return;
      }

      try {
        const response = await this.callGenerationAPI(this.prompt);
        this.generatedDesign = response;

        // Update quota after successful generation with the current design's ID
        const postId = Math.random().toString(36).substring(2, 15);
        this.quotaService
          .incrementQuota(postId, 'design')
          .pipe(
            catchError((err) => {
              console.error('Failed to update quota:', err);
              return [];
            })
          )
          .subscribe((result) => {
            if (result && result.success) {
              // Refresh quota status immediately after consumption
              this.fetchQuotaStatus(true);

              // If quota is now exhausted, show a notification
              if (
                result.newQuotaInfo &&
                result.newQuotaInfo.remainingPosts === 0
              ) {
                this.errorMessage =
                  'You have used all your available generations. Please upgrade your plan for more.';
              }
            }
          });

        // Render the design in the preview frame after a short delay
        setTimeout(() => {
          this.renderDesign();
        }, 100);
      } catch (error: any) {
        console.error('Design generation error:', error);
        if (
          error.status === 403 &&
          error.error &&
          error.error.error === 'QuotaExceeded'
        ) {
          // Redirect to plans page
          this.router.navigate(['/plans'], {
            queryParams: {
              reason: 'quota_exceeded',
              returnUrl: this.router.url,
            },
          });
        } else {
          this.errorMessage =
            'Failed to generate design. Please try again later.';
        }
      }
    } catch (error) {
      console.error('Error checking quota:', error);
      this.errorMessage =
        'Could not verify your quota status. Please try again.';
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

  fetchQuotaStatus(silent: boolean = false): Promise<QuotaStatus | null> {
    if (!silent) {
      this.isQuotaLoading = true;
    }
    this.quotaError = null;

    // First call getQuotaInfo to ensure quota is initialized
    return firstValueFrom(this.quotaService.getQuotaInfo())
      .then(() => {
        // Then get the quota status
        return firstValueFrom(this.quotaService.getQuotaStatus());
      })
      .then((status) => {
        this.quotaStatus = status;
        this.isQuotaLoading = false;
        return status;
      })
      .catch((err) => {
        console.error('Failed to load quota information:', err);
        this.quotaError = 'Failed to load quota information';
        this.isQuotaLoading = false;
        return null;
      });
  }
}
