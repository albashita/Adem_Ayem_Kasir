<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuController extends Controller
{
    public function index()
    {
        $menus = Menu::with('category')
            ->orderBy('id_menu')
            ->get();

        $categories = Category::where('is_active', 1)
            ->orderBy('name')
            ->get();

        return view('menu.index', [
            'pageKey' => 'menu',
            'menus' => $menus,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:20',
            'description' => 'nullable|string|max:200',
            'price' => 'required|integer|min:1',
            'categories_id_categorie' =>
                'required|integer|exists:categories,id_categorie',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')
                ->store('menus', 'public');
        } else {
            unset($validated['image']);
        }

        $menu = Menu::create($validated);

        return response()->json([
            'message' => 'Menu berhasil ditambahkan.',
            'menu' => $menu->load('category'),
            'code' => 'MENU-' . str_pad(
                $menu->id_menu,
                3,
                '0',
                STR_PAD_LEFT
            ),
        ], 201);
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:20',
            'description' => 'nullable|string|max:200',
            'price' => 'required|integer|min:1',
            'categories_id_categorie' =>
                'required|integer|exists:categories,id_categorie',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($menu->image) {
                Storage::disk('public')->delete($menu->image);
            }

            $validated['image'] = $request->file('image')
                ->store('menus', 'public');
        } else {
            unset($validated['image']);
        }

        $menu->update($validated);

        return response()->json([
            'message' => 'Menu berhasil diperbarui.',
            'menu' => $menu->fresh()->load('category'),
            'code' => 'MENU-' . str_pad(
                $menu->id_menu,
                3,
                '0',
                STR_PAD_LEFT
            ),
        ]);
    }

    public function destroy(Menu $menu)
    {
        if ($menu->image) {
            Storage::disk('public')->delete($menu->image);
        }

        $menu->delete();

        return response()->json([
            'message' => 'Menu berhasil dihapus.',
        ]);
    }
    public function data()
{
    $menus = Menu::with('category')
        ->orderBy('id_menu')
        ->get()
        ->map(function ($menu) {
            $menu->image_url = (
                $menu->image &&
                str_starts_with($menu->image, 'menus/') &&
                Storage::disk('public')->exists($menu->image)
            )
                ? Storage::disk('public')->url($menu->image)
                : null;

            return $menu;
        });

    return response()->json($menus);
}
}
