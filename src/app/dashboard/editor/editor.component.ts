import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements OnInit, AfterViewInit {
  @ViewChild('previewFrame') previewFrame!: ElementRef;

  currentView: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  previewScale = 1;
  isMobileScreen = false;

  // Panel states
  isCollapsed = false;
  isSidebarActive = false;

  // Design generation states
  prompt = '';
  generatedDesign: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  private resizeListener: () => void;
  private resizeObserver: ResizeObserver;

  constructor() {
    this.resizeListener = () => this.handleResize();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.currentView !== 'desktop') {
        this.adjustPreviewScale();
      }
    });
    this.setInitialView();
  }

  private setInitialView() {
    if (window.innerWidth < 640) {
      this.currentView = 'mobile';
      this.isMobileScreen = true;
    }
  }

  renderDesign() {
    if (!this.generatedDesign) return;

    const iframe = this.previewFrame?.nativeElement as HTMLIFrameElement;
    if (iframe?.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(`
            ${this.generatedDesign}
      `);
      iframe.contentDocument.close();
    }
  }

  private adjustPreviewScale() {
    // Add your scaling logic here if needed
  }

  ngOnInit() {
    window.addEventListener('resize', this.resizeListener);
  }

  ngAfterViewInit() {
    const previewWrapper = document.querySelector('.preview-wrapper');
    if (previewWrapper) {
      this.resizeObserver.observe(previewWrapper);
    }
    this.adjustPreviewScale();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
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

  generateDesign() {
    if (!this.prompt.trim()) {
      alert('Please enter a prompt.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const payload = {
      messages_data: [
        { role: "user", content: "Test" }
      ]
    };

    // Simulate API call
    // this.http
    //   .post<{ success: boolean; html_content: string }>(
    //     'http://0.0.0.0:8000/generate-html', payload, {
    //       headers: {
    //         'Content-Type': 'application/json'
    //       }
    //   }).subscribe({
    //     next: (response) => {
    //       if (response.success) {
    //         this.generatedDesign = response.html_content;
    //         console.log(this.generateDesign)
    //         this.renderDesign();
    //       } else {
    //         this.errorMessage = 'Failed to generate design.';
    //       }
    //     },
    //     error: () => {
    //       this.errorMessage = 'Error generating design.';
    //     },
    //     complete: () => {
    //       this.isLoading = false;
    //     },
    //   });

    this.generatedDesign = this.provideGeneratedDesignExample();
    this.renderDesign();
    this.isLoading = false;
  }
  
  provideGeneratedDesignExample(): string {
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>AI Platform | Future of Intelligence</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <link href=\"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css\" rel=\"stylesheet\">\n    <link href=\"https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">\n    <style>\n        body {\n            font-family: 'Space Grotesk', sans-serif;\n            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n        }\n        .gradient-text {\n            background: linear-gradient(90deg, #38bdf8, #818cf8);\n            -webkit-background-clip: text;\n            -webkit-text-fill-color: transparent;\n        }\n        .floating {\n            animation: float 6s ease-in-out infinite;\n        }\n        @keyframes float {\n            0% { transform: translateY(0px); }\n            50% { transform: translateY(-20px); }\n            100% { transform: translateY(0px); }\n        }\n        .glow {\n            box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);\n        }\n    </style>\n</head>\n<body class=\"text-gray-100 min-h-screen\">\n    <nav class=\"container mx-auto px-6 py-4\">\n        <div class=\"flex justify-between items-center\">\n            <div class=\"text-2xl font-bold gradient-text\">AI.Platform</div>\n            <div class=\"hidden md:flex space-x-8\">\n                <a href=\"#features\" class=\"hover:text-blue-400 transition\">Features</a>\n                <a href=\"#how-to\" class=\"hover:text-blue-400 transition\">How to Use</a>\n                <a href=\"#demo\" class=\"hover:text-blue-400 transition\">Demo</a>\n            </div>\n        </div>\n    </nav>\n\n    <main class=\"container mx-auto px-6\">\n        <!-- Hero Section -->\n        <section class=\"py-20 text-center\">\n            <div class=\"max-w-4xl mx-auto\">\n                <h1 class=\"text-5xl md:text-7xl font-bold mb-8 gradient-text\">\n                    The Future of AI is Here\n                </h1>\n                <p class=\"text-xl text-gray-300 mb-12\">\n                    Transform your workflow with state-of-the-art artificial intelligence. \n                    Experience the power of next-generation machine learning.\n                </p>\n                <button class=\"bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 glow\">\n                    Get Started Now\n                </button>\n            </div>\n        </section>\n\n        <!-- Demo Video Section -->\n        <section id=\"demo\" class=\"py-20\">\n            <div class=\"max-w-4xl mx-auto bg-slate-800/50 rounded-2xl p-8 backdrop-blur-sm\">\n                <h2 class=\"text-3xl font-bold mb-8 text-center gradient-text\">See AI.Platform in Action</h2>\n                <div class=\"aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-2xl\">\n                    <video class=\"w-full rounded-xl\" controls poster=\"https://images.unsplash.com/photo-1673194112431-14530ce9b0e5?auto=format&fit=crop&q=80\">\n                        <source src=\"#\" type=\"video/mp4\">\n                        Your browser does not support the video tag.\n                    </video>\n                </div>\n            </div>\n        </section>\n\n        <!-- How to Use Section -->\n        <section id=\"how-to\" class=\"py-20\">\n            <h2 class=\"text-3xl font-bold mb-16 text-center gradient-text\">How to Use AI.Platform</h2>\n            <div class=\"grid md:grid-cols-3 gap-12\">\n                <div class=\"bg-slate-800/30 p-8 rounded-2xl backdrop-blur-sm floating\">\n                    <div class=\"text-5xl mb-4 text-blue-400\"><i class=\"bi bi-1-circle\"></i></div>\n                    <h3 class=\"text-xl font-bold mb-4\">Sign Up</h3>\n                    <p class=\"text-gray-300\">Create your account in seconds and get immediate access to our AI tools.</p>\n                </div>\n                <div class=\"bg-slate-800/30 p-8 rounded-2xl backdrop-blur-sm floating\" style=\"animation-delay: 0.2s\">\n                    <div class=\"text-5xl mb-4 text-blue-400\"><i class=\"bi bi-2-circle\"></i></div>\n                    <h3 class=\"text-xl font-bold mb-4\">Upload Your Data</h3>\n                    <p class=\"text-gray-300\">Simply drag and drop your files or integrate with our API.</p>\n                </div>\n                <div class=\"bg-slate-800/30 p-8 rounded-2xl backdrop-blur-sm floating\" style=\"animation-delay: 0.4s\">\n                    <div class=\"text-5xl mb-4 text-blue-400\"><i class=\"bi bi-3-circle\"></i></div>\n                    <h3 class=\"text-xl font-bold mb-4\">Get Results</h3>\n                    <p class=\"text-gray-300\">Watch as our AI processes your data and delivers insights in real-time.</p>\n                </div>\n            </div>\n        </section>\n\n        <!-- Features Section -->\n        <section id=\"features\" class=\"py-20\">\n            <div class=\"max-w-4xl mx-auto text-center\">\n                <h2 class=\"text-3xl font-bold mb-16 gradient-text\">Advanced Features</h2>\n                <div class=\"grid md:grid-cols-2 gap-8\">\n                    <div class=\"bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition\">\n                        <i class=\"bi bi-cpu text-4xl text-blue-400\"></i>\n                        <h3 class=\"text-xl font-bold my-4\">Neural Processing</h3>\n                        <p class=\"text-gray-300\">Advanced neural networks for complex computations</p>\n                    </div>\n                    <div class=\"bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition\">\n                        <i class=\"bi bi-graph-up text-4xl text-blue-400\"></i>\n                        <h3 class=\"text-xl font-bold my-4\">Real-time Analytics</h3>\n                        <p class=\"text-gray-300\">Instant insights and data visualization</p>\n                    </div>\n                    <div class=\"bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition\">\n                        <i class=\"bi bi-shield-check text-4xl text-blue-400\"></i>\n                        <h3 class=\"text-xl font-bold my-4\">Secure Processing</h3>\n                        <p class=\"text-gray-300\">Enterprise-grade security protocols</p>\n                    </div>\n                    <div class=\"bg-slate-800/30 p-6 rounded-xl backdrop-blur-sm hover:bg-slate-800/50 transition\">\n                        <i class=\"bi bi-cloud-arrow-up text-4xl text-blue-400\"></i>\n                        <h3 class=\"text-xl font-bold my-4\">Cloud Integration</h3>\n                        <p class=\"text-gray-300\">Seamless cloud storage and processing</p>\n                    </div>\n                </div>\n            </div>\n        </section>\n    </main>\n\n    <footer class=\"container mx-auto px-6 py-8 text-center text-gray-400\">\n        <p>© 2023 AI.Platform. All rights reserved.</p>\n    </footer>\n</body>\n</html>";
  }
}
