<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Category;
use App\Models\StockItem;
use App\Models\MenuIngredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        if (!$request->has('kode_menu') && $request->has('code')) {
            $request->merge(['kode_menu' => $request->input('code')]);
        }

        $validated = $request->validate([
            'kode_menu' => 'required|string|max:30|unique:menus,kode_menu',
            'name' => 'required|string|max:20',
            'description' => 'nullable|string|max:200',
            'price' => 'required|integer|min:1',
            'categories_id_categorie' =>
                'required|integer|exists:categories,id_categorie',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ], [
            'kode_menu.required' => 'Kode menu wajib diisi.',
            'kode_menu.unique' => 'Kode menu sudah digunakan.',
            'name.required' => 'Nama menu wajib diisi.',
            'price.required' => 'Harga wajib diisi.',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')
                ->store('menus', 'public');
        } else {
            unset($validated['image']);
        }

        $validated['is_active'] = true;

        $menu = Menu::create($validated);

        return response()->json([
            'message' => 'Menu berhasil ditambahkan.',
            'menu' => $menu->load('category'),
            'code' => $menu->code,
            'kode_menu' => $menu->kode_menu,
        ], 201);
    }

    public function update(Request $request, Menu $menu)
    {
        if (!$request->has('kode_menu') && $request->has('code')) {
            $request->merge(['kode_menu' => $request->input('code')]);
        }

        $validated = $request->validate([
            'kode_menu' => 'sometimes|required|string|max:30|unique:menus,kode_menu,' . $menu->id_menu . ',id_menu',
            'name' => 'required|string|max:20',
            'description' => 'nullable|string|max:200',
            'price' => 'required|integer|min:1',
            'categories_id_categorie' =>
                'required|integer|exists:categories,id_categorie',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ], [
            'kode_menu.required' => 'Kode menu wajib diisi.',
            'kode_menu.unique' => 'Kode menu sudah digunakan.',
            'name.required' => 'Nama menu wajib diisi.',
            'price.required' => 'Harga wajib diisi.',
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
            'code' => $menu->code,
            'kode_menu' => $menu->kode_menu,
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

    // Data menu untuk halaman Kasir (hanya menu aktif)
    public function kasirData()
    {
        $menus = Menu::with('category')
            ->where('is_active', 1)
            ->orderBy('name')
            ->get()
            ->map(fn ($menu) => [
                'id'          => $menu->id_menu,
                'code'        => $menu->code,
                'kode_menu'   => $menu->kode_menu,
                'name'        => $menu->name,
                'price'       => $menu->price,
                'category_id' => $menu->categories_id_categorie,
                'category'    => $menu->category?->name,
                'image_url'   => (
                    $menu->image &&
                    Storage::disk('public')->exists($menu->image)
                )
                    ? Storage::disk('public')->url($menu->image)
                    : null,
            ]);

        return response()->json($menus);
    }

    /**
     * Dapatkan data resep untuk menu tertentu beserta daftar bahan baku yang tersedia.
     */
    public function getRecipe(Request $request, Menu $menu)
    {
        if ($request->user()->role !== 'owner') {
            abort(403, 'Hanya Owner yang dapat mengakses pengaturan resep.');
        }

        $ingredients = $menu->ingredients()
            ->with('stockItem')
            ->get()
            ->map(function ($ing) {
                return [
                    'id_menu_ingredient' => $ing->id_menu_ingredient,
                    'id_stock_item' => $ing->stock_items_id_stock_item,
                    'name' => $ing->stockItem?->name ?? 'Bahan tidak ditemukan',
                    'unit' => $ing->stockItem?->unit ?? '-',
                    'quantity_required' => (float) $ing->quantity_required,
                    'current_stock' => $ing->stockItem?->current_stock ?? 0,
                ];
            });

        $availableStockItems = StockItem::where('is_active', true)
            ->orderBy('name')
            ->get(['id_stock_item', 'name', 'unit', 'current_stock'])
            ->map(function ($item) {
                return [
                    'id_stock_item' => $item->id_stock_item,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'current_stock' => $item->current_stock,
                ];
            });

        return response()->json([
            'menu' => [
                'id_menu' => $menu->id_menu,
                'name' => $menu->name,
                'code' => $menu->code,
                'kode_menu' => $menu->kode_menu,
                'price' => $menu->price,
            ],
            'ingredients' => $ingredients,
            'available_stock_items' => $availableStockItems,
        ]);
    }

    /**
     * Simpan pengaturan resep menu.
     * Tidak mengubah stok bahan baku di stock_items.
     */
    public function saveRecipe(Request $request, Menu $menu)
    {
        if ($request->user()->role !== 'owner') {
            abort(403, 'Hanya Owner yang dapat mengatur resep menu.');
        }

        $validated = $request->validate([
            'ingredients' => 'nullable|array',
            'ingredients.*.id_stock_item' => 'required|integer|exists:stock_items,id_stock_item',
            'ingredients.*.quantity_required' => 'required|numeric|gt:0',
        ], [
            'ingredients.*.id_stock_item.required' => 'Bahan baku wajib dipilih.',
            'ingredients.*.id_stock_item.exists' => 'Bahan baku tidak valid.',
            'ingredients.*.quantity_required.required' => 'Jumlah bahan baku wajib diisi.',
            'ingredients.*.quantity_required.numeric' => 'Jumlah bahan baku harus berupa angka.',
            'ingredients.*.quantity_required.gt' => 'Jumlah bahan baku harus lebih besar dari 0.',
        ]);

        $ingredientsData = $validated['ingredients'] ?? [];

        // Validasi duplikasi bahan baku dalam resep
        $stockIds = array_column($ingredientsData, 'id_stock_item');
        if (count($stockIds) !== count(array_unique($stockIds))) {
            return response()->json([
                'message' => 'Bahan baku yang sama tidak boleh dimasukkan lebih dari satu kali dalam resep ini.',
            ], 422);
        }

        DB::transaction(function () use ($menu, $ingredientsData) {
            // Hapus resep lama menu ini (tanpa mengubah stok barang)
            MenuIngredient::where('menus_id_menu', $menu->id_menu)->delete();

            // Masukkan data bahan baru
            foreach ($ingredientsData as $item) {
                MenuIngredient::create([
                    'menus_id_menu' => $menu->id_menu,
                    'stock_items_id_stock_item' => $item['id_stock_item'],
                    'quantity_required' => $item['quantity_required'],
                ]);
            }
        });

        $updatedIngredients = $menu->ingredients()
            ->with('stockItem')
            ->get()
            ->map(function ($ing) {
                return [
                    'id_menu_ingredient' => $ing->id_menu_ingredient,
                    'id_stock_item' => $ing->stock_items_id_stock_item,
                    'name' => $ing->stockItem?->name ?? 'Bahan tidak ditemukan',
                    'unit' => $ing->stockItem?->unit ?? '-',
                    'quantity_required' => (float) $ing->quantity_required,
                    'current_stock' => $ing->stockItem?->current_stock ?? 0,
                ];
            });

        return response()->json([
            'message' => 'Resep menu berhasil disimpan.',
            'ingredients' => $updatedIngredients,
        ]);
    }

    /**
     * Hapus satu bahan dari resep menu.
     */
    public function destroyRecipeIngredient(Request $request, Menu $menu, MenuIngredient $ingredient)
    {
        if ($request->user()->role !== 'owner') {
            abort(403, 'Hanya Owner yang dapat mengatur resep menu.');
        }

        if ($ingredient->menus_id_menu !== $menu->id_menu) {
            return response()->json([
                'message' => 'Bahan tidak terkait dengan menu ini.',
            ], 422);
        }

        $ingredient->delete();

        return response()->json([
            'message' => 'Bahan berhasil dihapus dari resep.',
        ]);
    }
}