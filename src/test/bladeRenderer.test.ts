import * as assert from 'assert';
import { BladeRenderer } from '../bladeRenderer';

suite('BladeRenderer', () => {
	const r = new BladeRenderer();

	test('strips {{-- comments --}}', () => {
		assert.strictEqual(r.render('a{{-- hi --}}b'), 'ab');
	});

	test('strips @php blocks', () => {
		assert.strictEqual(r.render('x@php $a = 1; @endphpy'), 'xy');
	});

	test('renders $var as variable name', () => {
		assert.strictEqual(r.render('{{ $name }}').trim(), 'name');
	});

	test('renders $var ?? "default" as default', () => {
		assert.strictEqual(r.render('{{ $name ?? "Guest" }}').trim(), 'Guest');
	});

	test('renders $var ?? 42 as number', () => {
		assert.strictEqual(r.render('{{ $count ?? 42 }}').trim(), '42');
	});

	test('config("app.name") → last segment', () => {
		assert.strictEqual(r.render('{{ config("app.name") }}').trim(), 'name');
	});

	test('config with default → default', () => {
		assert.strictEqual(r.render('{{ config("app.name", "MyApp") }}').trim(), 'MyApp');
	});

	test('old() and session() → empty', () => {
		assert.strictEqual(r.render('{{ old("x") }}|{{ session("y") }}').trim(), '|');
	});

	test('$user->email → email', () => {
		assert.strictEqual(r.render('{{ $user->email }}').trim(), 'email');
	});

	test("$arr['key'] → key", () => {
		assert.strictEqual(r.render("{{ $arr['key'] }}").trim(), 'key');
	});

	test('escapes HTML in output', () => {
		assert.ok(r.render('{{ $x ?? "<b>" }}').includes('&lt;b&gt;'));
	});

	test('@if/@else picks both branches', () => {
		const out = r.render('@if($a)YES@elseNO@endif');
		assert.ok(out.includes('YES'));
		assert.ok(out.includes('NO'));
		assert.ok(!out.includes('@if'));
		assert.ok(!out.includes('@endif'));
	});

	test('nested @foreach unwraps body', () => {
		const out = r.render('@foreach($xs as $x)@foreach($ys as $y)Z@endforeach@endforeach');
		assert.ok(out.includes('Z'));
		assert.ok(!out.includes('@foreach'));
		assert.ok(!out.includes('@endforeach'));
	});

	test('@auth/@guest/@isset/@empty unwrap', () => {
		assert.ok(r.render('@auth A @endauth').includes('A'));
		assert.ok(r.render('@guest G @endguest').includes('G'));
		assert.ok(r.render('@isset($x) I @endisset').includes('I'));
		assert.ok(r.render('@empty($x) E @endempty').includes('E'));
	});

	test('@csrf → hidden token input', () => {
		assert.ok(r.render('@csrf').includes('name="_token"'));
	});

	test('@method("PUT") → hidden method input', () => {
		assert.ok(r.render('@method("PUT")').includes('value="PUT"'));
	});

	test('@yield with default → default', () => {
		assert.ok(r.render('@yield("title", "Home")').includes('Home'));
	});

	test('@extends/@section/@include/@vite stripped', () => {
		const out = r.render('@extends("layout")@section("a")body@endsection@include("partial")@vite("app.js")');
		assert.ok(!out.includes('@'));
		assert.ok(out.includes('body'));
	});

	test('does not crash on unbalanced @if', () => {
		assert.doesNotThrow(() => r.render('@if($x) hello'));
	});
});
