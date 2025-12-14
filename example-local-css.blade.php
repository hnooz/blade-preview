<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Local CSS Example' }}</title>
    
    <!-- Local CSS file -->
    <link rel="stylesheet" href="/css/app.css">
</head>
<body>
    <nav class="navbar">
        <div class="container d-flex justify-content-between align-items-center">
            <a href="#" class="navbar-brand">
                🚀 {{ config('app.name', 'Laravel') }}
            </a>
            <ul class="navbar-nav">
                <li><a href="#" class="nav-link">Home</a></li>
                <li><a href="#" class="nav-link">About</a></li>
                <li><a href="#" class="nav-link">Contact</a></li>
            </ul>
        </div>
    </nav>

    <div class="container mt-5">
        <h1 class="mb-4 text-center">Welcome to Laravel with Local CSS</h1>

        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @if($showWelcome)
            <div class="alert alert-info">
                <strong>Hello!</strong> This template uses local CSS files instead of CDN.
            </div>
        @endif

        <div class="row">
            <div class="col-8">
                <div class="card">
                    <div class="card-header">
                        Featured Content
                    </div>
                    <div class="card-body">
                        <h3>{{ $heading ?? 'Main Content' }}</h3>
                        <p>{{ $description ?? 'This is a demonstration of local CSS styling in Laravel Blade templates.' }}</p>
                        
                        @foreach($items as $item)
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h4>{{ $item['title'] }}</h4>
                                    <p>{{ $item['content'] }}</p>
                                </div>
                            </div>
                        @endforeach
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary">Learn More</button>
                    </div>
                </div>
            </div>

            <div class="col-4">
                <div class="card">
                    <div class="card-header">
                        Quick Actions
                    </div>
                    <div class="card-body">
                        <form method="POST" action="/submit">
                            @csrf
                            
                            <div class="form-group">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" value="{{ old('name') }}">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" name="email" value="{{ old('email') }}">
                            </div>
                            
                            <button type="submit" class="btn btn-primary">Submit</button>
                        </form>
                    </div>
                </div>

                <div class="card mt-3">
                    <div class="card-header">
                        Statistics
                    </div>
                    <div class="card-body">
                        <div class="alert alert-success mb-2">
                            <strong>{{ $userCount ?? 0 }}</strong> Users
                        </div>
                        <div class="alert alert-warning mb-2">
                            <strong>{{ $postCount ?? 0 }}</strong> Posts
                        </div>
                        <div class="alert alert-danger">
                            <strong>{{ $commentCount ?? 0 }}</strong> Comments
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
