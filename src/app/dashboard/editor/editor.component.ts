import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent {
  isCollapsed = false; // Toggle state for the side panel
  prompt = ''; // Input prompt for design generation
  generatedDesign: string | null = null; // Holds the generated HTML design
  isLoading = false; // Indicates if design generation is in progress
  errorMessage: string | null = null; // Error message if any

  constructor() {}

  togglePanel() {
    this.isCollapsed = !this.isCollapsed;
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
  }

  renderDesign() {
    const iframe = document.getElementById('liveFrame') as HTMLIFrameElement;
    if (iframe && iframe.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(this.generatedDesign || '');
      iframe.contentDocument.close();
    }
  }

  refreshPreview() {
    this.renderDesign();
  }

  toggleView(view: 'desktop' | 'tablet' | 'mobile') {
    const iframe = document.getElementById('liveFrame') as HTMLIFrameElement;
    if (iframe) {
      if (view === 'tablet') iframe.style.width = '768px';
      else if (view === 'mobile') iframe.style.width = '375px';
      else iframe.style.width = '100%';
    }
  }

  provideGeneratedDesignExample(): string {
    return "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Modern Blog</title>\n    <link href=\"https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\" rel=\"stylesheet\">\n    <link href=\"https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css\" rel=\"stylesheet\">\n    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">\n</head>\n<style>\n    body {\n        font-family: 'Inter', sans-serif;\n    }\n    .blog-card:hover {\n        transform: translateY(-5px);\n        transition: transform 0.3s ease;\n    }\n</style>\n<body class=\"bg-gray-50\">\n    <!-- Navigation -->\n    <nav class=\"bg-white shadow-sm\">\n        <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\">\n            <div class=\"flex justify-between h-16 items-center\">\n                <div class=\"flex-shrink-0\">\n                    <h1 class=\"text-2xl font-bold text-gray-800\">BlogSpace</h1>\n                </div>\n                <div class=\"hidden md:block\">\n                    <div class=\"ml-10 flex items-baseline space-x-4\">\n                        <a href=\"#\" class=\"text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium\">Home</a>\n                        <a href=\"#\" class=\"text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium\">Categories</a>\n                        <a href=\"#\" class=\"text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium\">About</a>\n                        <a href=\"#\" class=\"text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium\">Contact</a>\n                    </div>\n                </div>\n                <div class=\"flex items-center\">\n                    <button id=\"newPostBtn\" class=\"bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700\">New Post</button>\n                </div>\n            </div>\n        </div>\n    </nav>\n\n    <!-- Hero Section -->\n    <div class=\"bg-white\">\n        <div class=\"max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8\">\n            <div class=\"text-center\">\n                <h2 class=\"text-base font-semibold text-blue-600 tracking-wide uppercase\">Welcome to BlogSpace</h2>\n                <p class=\"mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl\">Share your stories with the world</p>\n                <p class=\"max-w-xl mt-5 mx-auto text-xl text-gray-500\">A platform for writers, thinkers, and storytellers to share their perspectives with a global audience.</p>\n            </div>\n        </div>\n    </div>\n\n    <!-- Blog Posts Grid -->\n    <div class=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12\">\n        <div class=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8\" id=\"blogPosts\">\n            <!-- Blog posts will be dynamically inserted here -->\n        </div>\n    </div>\n\n    <!-- New Post Modal -->\n    <div id=\"newPostModal\" class=\"hidden fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center\">\n        <div class=\"bg-white rounded-lg p-8 max-w-md w-full\">\n            <h3 class=\"text-lg font-medium text-gray-900 mb-4\">Create New Post</h3>\n            <form id=\"newPostForm\">\n                <div class=\"mb-4\">\n                    <label class=\"block text-sm font-medium text-gray-700\">Title</label>\n                    <input type=\"text\" id=\"postTitle\" class=\"mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2\">\n                </div>\n                <div class=\"mb-4\">\n                    <label class=\"block text-sm font-medium text-gray-700\">Content</label>\n                    <textarea id=\"postContent\" rows=\"4\" class=\"mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2\"></textarea>\n                </div>\n                <div class=\"flex justify-end space-x-3\">\n                    <button type=\"button\" onclick=\"closeModal()\" class=\"bg-gray-200 px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300\">Cancel</button>\n                    <button type=\"submit\" class=\"bg-blue-600 px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-700\">Publish</button>\n                </div>\n            </form>\n        </div>\n    </div>\n\n    <script>\n        // Initialize local storage for blog posts if it doesn't exist\n        if (!localStorage.getItem('blogPosts')) {\n            localStorage.setItem('blogPosts', JSON.stringify([]));\n        }\n\n        // Generate a unique user ID and store it\n        if (!localStorage.getItem('userId')) {\n            localStorage.setItem('userId', 'user_' + Math.random().toString(36).substr(2, 9));\n        }\n\n        const userId = localStorage.getItem('userId');\n        const appSlug = 'blog-app-' + Math.random().toString(36).substr(2, 9);\n\n        // Modal controls\n        const modal = document.getElementById('newPostModal');\n        const newPostBtn = document.getElementById('newPostBtn');\n        const newPostForm = document.getElementById('newPostForm');\n\n        newPostBtn.addEventListener('click', () => {\n            modal.classList.remove('hidden');\n        });\n\n        function closeModal() {\n            modal.classList.add('hidden');\n            newPostForm.reset();\n        }\n\n        // Handle new post submission\n        newPostForm.addEventListener('submit', async (e) => {\n            e.preventDefault();\n            \n            const title = document.getElementById('postTitle').value;\n            const content = document.getElementById('postContent').value;\n            \n            const postData = {\n                title,\n                content,\n                date: new Date().toISOString(),\n                author: 'Anonymous'\n            };\n\n            try {\n                const response = await fetch('https://r0c8kgwocscg8gsokogwwsw4.zetaverse.one/db', {\n                    method: 'POST',\n                    headers: {\n                        'Authorization': 'Bearer ICufeeeRmJSE1KEO03Jzsf2YpPy2',\n                        'Content-Type': 'application/json'\n                    },\n                    body: JSON.stringify({\n                        userId,\n                        appSlug,\n                        action: 'create',\n                        table: 'posts',\n                        data: postData\n                    })\n                });\n\n                if (response.ok) {\n                    closeModal();\n                    loadPosts();\n                }\n            } catch (error) {\n                console.error('Error creating post:', error);\n            }\n        });\n\n        // Load posts from the database\n        async function loadPosts() {\n            try {\n                const response = await fetch('https://r0c8kgwocscg8gsokogwwsw4.zetaverse.one/db', {\n                    method: 'POST',\n                    headers: {\n                        'Authorization': 'Bearer ICufeeeRmJSE1KEO03Jzsf2YpPy2',\n                        'Content-Type': 'application/json'\n                    },\n                    body: JSON.stringify({\n                        userId,\n                        appSlug,\n                        action: 'read',\n                        table: 'posts'\n                    })\n                });\n\n                if (response.ok) {\n                    const result = await response.json();\n                    displayPosts(result.data);\n                }\n            } catch (error) {\n                console.error('Error loading posts:', error);\n            }\n        }\n\n        // Display posts in the grid\n        function displayPosts(posts) {\n            const postsContainer = document.getElementById('blogPosts');\n            postsContainer.innerHTML = '';\n\n            posts.forEach(post => {\n                const date = new Date(post.data.date).toLocaleDateString();\n                const card = `\n                    <div class=\"blog-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg\">\n                        <div class=\"p-6\">\n                            <h3 class=\"text-xl font-semibold text-gray-900 mb-2\">${post.data.title}</h3>\n                            <p class=\"text-gray-600 mb-4\">${post.data.content.substring(0, 150)}...</p>\n                            <div class=\"flex justify-between items-center\">\n                                <span class=\"text-sm text-gray-500\">${date}</span>\n                                <span class=\"text-sm text-gray-500\">${post.data.author}</span>\n                            </div>\n                        </div>\n                    </div>\n                `;\n                postsContainer.innerHTML += card;\n            });\n        }\n\n        // Initial load of posts\n        loadPosts();\n    </script>\n</body>\n</html>";
  }
}
