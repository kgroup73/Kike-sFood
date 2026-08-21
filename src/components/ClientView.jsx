import React, { useMemo } from 'react';
import {
  Search,
  Grid,
  List,
  Plus,
  X,
  Award,
  Leaf,
  Wheat
} from 'lucide-react';
import { formatCOP } from '../lib/dian';
import { CATEGORIES } from '../data/mockData';

export default function ClientView({
  products,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  dietaryFilter,
  setDietaryFilter,
  clientLayout,
  setClientLayout,
  setSelectedProduct
}) {
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const isAvailable = p.available !== false;
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesDiet = true;
      if (dietaryFilter === 'veg') matchesDiet = p.isVeg;
      if (dietaryFilter === 'chef') matchesDiet = p.isChef;
      if (dietaryFilter === 'gf') matchesDiet = p.isGf;
      return isAvailable && matchesCategory && matchesSearch && matchesDiet;
    });
  }, [products, searchQuery, activeCategory, dietaryFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="sticky top-[58px] z-20 bg-slate-950/90 backdrop-blur-md -mx-3 px-3 py-2 space-y-2 border-b border-slate-800/80 sm:static sm:bg-transparent sm:backdrop-blur-none sm:p-0 sm:border-none sm:mx-0">
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar platillo o ingrediente..."
              className="w-full bg-slate-900 border border-slate-800 text-white pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setClientLayout('list')}
              className={`p-1.5 rounded-lg text-xs w-8 h-8 flex items-center justify-center transition-colors ${clientLayout === 'list' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setClientLayout('grid')}
              className={`p-1.5 rounded-lg text-xs w-8 h-8 flex items-center justify-center transition-colors ${clientLayout === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista Cuadrícula"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar text-[11px] py-0.5">
          <button
            onClick={() => setDietaryFilter(dietaryFilter === 'chef' ? '' : 'chef')}
            className={`border px-2.5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${dietaryFilter === 'chef' ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'}`}
          >
            <Award className="w-3 h-3 text-amber-400" /> Especial Chef
          </button>

          <button
            onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? '' : 'veg')}
            className={`border px-2.5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${dietaryFilter === 'veg' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'}`}
          >
            <Leaf className="w-3 h-3 text-emerald-400" /> Vegano
          </button>

          <button
            onClick={() => setDietaryFilter(dietaryFilter === 'gf' ? '' : 'gf')}
            className={`border px-2.5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap transition-all ${dietaryFilter === 'gf' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'}`}
          >
            <Wheat className="w-3 h-3 text-indigo-400" /> Sin Gluten
          </button>
        </div>

        <div className="flex space-x-1.5 overflow-x-auto hide-scrollbar pt-1 border-t border-slate-900">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20' : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800/80'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {clientLayout === 'list' ? (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 hover:border-slate-700 transition-all flex items-center gap-3 shadow-md group">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                {product.isChef && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md shadow">
                    Chef
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-1">
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm truncate cursor-pointer group-hover:text-orange-500 transition-colors" onClick={() => setSelectedProduct(product)}>
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-0.5">{product.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-orange-500 font-extrabold text-sm sm:text-base">{formatCOP(product.price)}</span>
                  <button onClick={() => setSelectedProduct(product)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-[11px] rounded-xl shadow transition-all flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Pedir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg">
              <div className="relative h-40 sm:h-48 overflow-hidden bg-slate-950 cursor-pointer" onClick={() => setSelectedProduct(product)}>
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.isChef && <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">Chef</span>}
                  {product.isVeg && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">Vegano</span>}
                  {product.isGf && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">Sin Gluten</span>}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-orange-500 transition-colors cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-orange-500 font-extrabold text-sm sm:text-base">{formatCOP(product.price)}</span>
                  <button onClick={() => setSelectedProduct(product)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!filteredProducts.length && (
        <div className="py-12 text-center text-slate-500 space-y-2">
          <Search className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-xs">No se encontraron platillos con el filtro seleccionado.</p>
        </div>
      )}
    </div>
  );
}
