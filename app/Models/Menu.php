<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $table = 'menus';

    protected $primaryKey = 'id_menu';

    protected $fillable = [
        'name',
        'description',
        'price',
        'image',
        'is_active',
        'categories_id_categorie',
    ];

    protected $casts = [
        'price' => 'integer',
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(
            Category::class,
            'categories_id_categorie',
            'id_categorie'
        );
    }
}
