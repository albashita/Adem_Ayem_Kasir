<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'expenses';

    protected $primaryKey = 'id_expense';

    public const CATEGORIES = [
        'Bahan Baku',
        'Operasional',
        'Gaji',
        'Transportasi',
        'Perawatan',
        'Lain-lain',
    ];

    protected $fillable = [
        'expense_date',
        'category',
        'description',
        'amount',
    ];

    protected $casts = [
        'expense_date' => 'date:Y-m-d',
        'amount'       => 'decimal:2',
    ];
}
