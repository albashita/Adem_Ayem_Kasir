<?php

namespace App\Http\Controllers;

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