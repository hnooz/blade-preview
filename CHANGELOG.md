# Changelog

All notable changes to Blade Preview will be documented in this file.

## [0.1.0] - 2026-04-03

### Added
- Live preview of Laravel Blade templates in a side panel
- Auto-update as you type
- CDN CSS/JS loading (Bootstrap, Tailwind, Font Awesome, etc.)
- Blade directive processing: `@if`, `@foreach`, `@for`, `@while`, `@auth`, `@guest`, `@isset`, `@empty`
- Blade expression rendering: `{{ $var }}`, `{!! $var !!}`, null coalesce defaults, `config()`, `old()`, `session()`
- Template inheritance directives handled: `@extends`, `@section`, `@yield`, `@include`
- Component directives handled: `@component`, `@slot`, `@push`, `@stack`
- Form helpers: `@csrf`, `@method`
- Inline `<style>` block support
- Side-by-side editing via editor title bar icon and context menu
- CSP-secured webview with nonce-based script execution
