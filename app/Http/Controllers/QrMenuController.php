<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class QrMenuController extends Controller
{
    public function index(): View
    {
         return view('menu.qr-menu');
    }

    public function data(): JsonResponse
    {
        $menus = Menu::with('category')
            ->where('is_active', 1)
            ->orderBy('name')
            ->get()
            ->map(function ($menu) {
                return [
                    'id_menu' => $menu->id_menu,
                    'name' => $menu->name,
                    'description' => $menu->description,
                    'price' => $menu->price,
                    'image_url' => $menu->image
                        ? asset('storage/' . $menu->image)
                        : null,
                    'category' => $menu->category
                        ? [
                            'name' => $menu->category->name,
                        ]
                        : null,
                ];
            });

        return response()->json($menus);
    }
}
