<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'id_payment';
    public $timestamps = false;

    protected $fillable = ['payment_method', 'amount', 'paid_at', 'reference_number', 'notes', 'orders_id_order'];
}