<?php

namespace App\Http\Controllers;

<<<<<<< HEAD
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
=======
use App\Models\Category;
use Illuminate\Routing\Controller;

class QrMenuController extends Controller
{
    public function index()
    {
        $categories = Category::with('menus')->get();

        return view('menu.qr-menu', compact('categories'));
    }
}
>>>>>>> 886f7b9cc5a26ac9078b813161c97fc727a8ba45
