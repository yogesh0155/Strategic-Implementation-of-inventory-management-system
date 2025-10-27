// Dashboard with colorful gradients using Chart.js
(function(){
  function read(){ try{ return JSON.parse(localStorage.getItem("inventory_items_v1_color")||"[]") }catch(e){return []} }
  function number(n){ return Number(n||0).toFixed(2) }

  function snapshot(){
    const items = read();
    document.getElementById("snapItems").textContent = items.length;
    document.getElementById("snapCategories").textContent = [...new Set(items.map(i=>i.category||''))].filter(Boolean).length;
    document.getElementById("snapValue").textContent = number(items.reduce((s,i)=>s + (i.quantity * i.price),0));
  }

  function buildValueByCategory(){
    const items = read();
    const map = {};
    items.forEach(i=>{
      const key = i.category||'Uncategorized';
      map[key] = (map[key]||0) + (i.quantity * i.price);
    });
    const labels = Object.keys(map);
    const values = labels.map(l=>map[l]);
    return {labels, values};
  }

  function buildTopQty(){
    const items = read().slice();
    items.sort((a,b)=> b.quantity - a.quantity);
    const top = items.slice(0,10);
    return {labels: top.map(i=>i.name), values: top.map(i=>i.quantity)};
  }

  function gradientFor(ctx, area, i){
    const g = ctx.createLinearGradient(0,0,area.width,0);
    const palette = [
      ['#ff6b6b','#ff9a9e'],
      ['#7c5cff','#b08bff'],
      ['#00d4ff','#5ef7d3'],
      ['#ffd66b','#ff9b6b'],
      ['#7efc8e','#42d4ff']
    ];
    const p = palette[i % palette.length];
    g.addColorStop(0, p[0]);
    g.addColorStop(1, p[1]);
    return g;
  }

  function mkPie(ctx, labels, values){
    const area = ctx.canvas;
    const datasets = [{ data: values, backgroundColor: labels.map((l,i)=>gradientFor(ctx, area, i)) }];
    return new Chart(ctx, { type:'pie', data:{ labels, datasets }, options:{ responsive:true, plugins:{legend:{position:'bottom'} } } });
  }

  function mkBar(ctx, labels, values){
    const area = ctx.canvas;
    const dataset = { label:'Quantity', data: values, backgroundColor: labels.map((l,i)=>gradientFor(ctx, area, i)) };
    return new Chart(ctx, { type:'bar', data:{ labels, datasets:[dataset] }, options:{ responsive:true, scales:{ y:{ beginAtZero:true } } } });
  }

  function init(){
    snapshot();
    const v = buildValueByCategory();
    const ctx1 = document.getElementById("valueByCategory").getContext("2d");
    if(v.labels.length===0){
      ctx1.canvas.parentNode.innerHTML = '<p class="muted">No data. Add items in Inventory.</p>';
    }else{
      mkPie(ctx1, v.labels, v.values);
    }

    const t = buildTopQty();
    const ctx2 = document.getElementById("topQty").getContext("2d");
    if(t.labels.length===0){
      ctx2.canvas.parentNode.innerHTML = '<p class="muted">No data. Add items in Inventory.</p>';
    }else{
      mkBar(ctx2, t.labels, t.values);
    }

    window.addEventListener('storage', ()=> setTimeout(()=> location.reload(), 200));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
