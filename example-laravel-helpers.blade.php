<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Laravel Helpers Example' }}</title>
    
    <!-- Using asset() helper -->
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    
    <!-- Using url() helper -->
    <link rel="stylesheet" href="{{ url('css/app.css') }}">
    
    <!-- Using public_path() helper -->
    <link rel="stylesheet" href="{{ public_path('css/app.css') }}">
    
    <!-- Using base_path() helper -->
    <link rel="stylesheet" href="{{ base_path('public/css/app.css') }}">
    
    <!-- Using @vite directive (Laravel 9+) -->
    @vite(['resources/css/app.css'])
    
    <!-- Using mix() helper (Laravel Mix) -->
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
</head>
<body>
    <nav class="navbar">
        <div class="container d-flex justify-content-between align-items-center">
            <a href="#" class="navbar-brand">
                🚀 {{ config('app.name', 'Laravel') }}
            </a>
            <ul class="navbar-nav">
                <li><a href="#" class="nav-link">Home</a></li>
                <li><a href="#" class="nav-link">Helpers</a></li>
                <li><a href="#" class="nav-link">About</a></li>
            </ul>
        </div>
    </nav>

    <div class="container mt-5">
        <div class="card">
            <div class="card-header">
                Laravel Helper Functions
            </div>
            <div class="card-body">
                <h3>CSS Loading Methods</h3>
                <p>This template demonstrates various Laravel helper functions for loading CSS files:</p>
                
                <ul>
                    <li><code>asset('css/app.css')</code> - Returns URL for public asset</li>
                    <li><code>url('css/app.css')</code> - Generate a fully qualified URL</li>
                    <li><code>public_path('css/app.css')</code> - Get path to public directory</li>
                    <li><code>base_path('public/css/app.css')</code> - Get path from app root</li>
                    <li><code>@vite(['resources/css/app.css'])</code> - Vite asset bundling</li>
                    <li><code>mix('css/app.css')</code> - Laravel Mix versioning</li>
                </ul>

                @if($showInfo)
                    <div class="alert alert-info mt-3">
                        <strong>Info:</strong> All these methods are supported by the Blade Preview extension!
                    </div>
                @endif
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-6">
                <div class="card">
                    <div class="card-header">
                        Server-side Rendering
                    </div>
                    <div class="card-body">
                        <p>In Laravel, these helpers resolve to actual URLs:</p>
                        <pre><code>{{ $asset_url ?? 'http://localhost/css/app.css' }}</code></pre>
                    </div>
                </div>
            </div>

            <div class="col-6">
                <div class="card">
                    <div class="card-header">
                        Preview Extension
                    </div>
                    <div class="card-body">
                        <p>The extension searches for CSS files in:</p>
                        <ul>
                            <li>public/css/</li>
                            <li>resources/css/</li>
                            <li>public/build/ (Vite)</li>
                            <li>public/mix-manifest.json (Mix)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mt-4">
            <div class="card-header">
                Form Example
            </div>
            <div class="card-body">
                <form method="POST" action="{{ url('/submit') }}">
                    @csrf
                    
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" class="form-control" name="name" value="{{ old('name') }}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-control" name="email" value="{{ old('email') }}">
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Submit Form</button>
                </form>
            </div>
        </div>
    </div>

    <!-- JavaScript with Laravel helpers -->
    <script src="{{ asset('js/app.js') }}"></script>
    <script src="{{ url('js/app.js') }}"></script>
</body>
</html>
