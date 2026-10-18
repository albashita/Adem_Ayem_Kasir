<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';
    protected $primaryKey = 'id_categorie';

    public function menus()
{
    return $this->hasMany(Menu::class, 'categories_id_categorie', 'id_categorie');
}
}