<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Blade Template</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .container {
            background: #f5f5f5;
            padding: 30px;
            border-radius: 8px;
        }
        h1 {
            color: #ff2d20;
        }
        .card {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{ $title }}</h1>
        
        @if($showWelcome)
            <div class="card">
                <h2>Welcome!</h2>
                <p>This is a sample Laravel Blade template.</p>
            </div>
        @endif

        @foreach($items as $item)
            <div class="card">
                <h3>اثث q</h3>
                <p>{{ ['description'] }}</p>
            </div>
        @endforeach

        <form method="POST" action="/submit">
            @csrf
            <div class="card">
                <label>Name:</label>
                <input type="text" name="name" value="{{ old('name') }}">
                
                <label>Email:</label>
                <input type="email" name="email" value="{{ old('email') }}">
                
                <button type="submit">Submit</button>
            </div>
        </form>
    </div>
</body>
</html>
