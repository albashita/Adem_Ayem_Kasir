@extends('layouts.app')

@section('title', 'Dashboard - Adem Ayem')
@section('page-title', 'Dashboard')

@section('content')
      <div class="grid" id="dashStats"></div>
      <div class="panel"><h3>Stok Bahan Menipis (≤5)</h3>
      <table><thead><tr><th>Barang</th><th>Kategori</th><th>Sisa Stok</th><th>Satuan</th></tr></thead><tbody id="lowStockBody"></tbody></table></div>
    

@endsection