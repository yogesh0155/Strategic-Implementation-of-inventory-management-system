// Inventory logic (same functionality, colorful UI)
(function(){
  const LS_KEY = "inventory_items_v1_color";

  // DOM refs
  const form = document.getElementById("itemForm");
  const nameI = document.getElementById("name");
  const catI = document.getElementById("category");
  const qtyI = document.getElementById("quantity");
  const priceI = document.getElementById("price");
  const descI = document.getElementById("description");
  const idI = document.getElementById("itemId");
  const tableBody = document.querySelector("#itemsTable tbody");
  const totalQtyEl = document.getElementById("totalQty");
  const totalValEl = document.getElementById("totalVal");
  const statItems = document.getElementById("statItems");
  const statCategories = document.getElementById("statCategories");
  const statValue = document.getElementById("statValue");
  const searchI = document.getElementById("search");
  const filterCat = document.getElementById("filterCategory");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  const clearBtn = document.getElementById("clearBtn");
  const resetBtn = document.getElementById("resetBtn");

  function uid(){ return 'id-'+Math.random().toString(36).slice(2,10); }
  function read(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||"[]") }catch(e){return []} }
  function write(items){ localStorage.setItem(LS_KEY, JSON.stringify(items)); }

  function render(){
    const q = searchI.value.trim().toLowerCase();
    const cat = filterCat.value;
    const items = read().filter(i=>{
      const matchQ = i.name.toLowerCase().includes(q) || (i.category||'').toLowerCase().includes(q);
      const matchCat = !cat || i.category===cat;
      return matchQ && matchCat;
    });
    tableBody.innerHTML = "";
    let totalQty=0, totalVal=0;
    items.forEach(it=>{
      const tr = document.createElement("tr");
      const total = (it.quantity*it.price)||0;
      tr.innerHTML = `
        <td>${escapeHtml(it.name)}</td>
        <td>${escapeHtml(it.category||'—')}</td>
        <td>${it.quantity}</td>
        <td>${number(it.price)}</td>
        <td>${number(total)}</td>
        <td>
          <button class="btn small edit" data-id="${it.id}">Edit</button>
          <button class="btn small ghost del" data-id="${it.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
      totalQty += Number(it.quantity||0);
      totalVal += Number(total||0);
    });
    totalQtyEl.textContent = totalQty;
    totalValEl.textContent = number(totalVal);
    statItems.textContent = read().length;
    statCategories.textContent = [...new Set(read().map(x=>x.category||""))].filter(Boolean).length;
    statValue.textContent = number(read().reduce((s,i)=>s + (i.quantity*i.price),0));
    // attach handlers
    tableBody.querySelectorAll("button.edit").forEach(b=>{
      b.addEventListener("click", ()=> loadForEdit(b.dataset.id));
    });
    tableBody.querySelectorAll("button.del").forEach(b=>{
      b.addEventListener("click", ()=> { if(confirm("Delete item?")) removeItem(b.dataset.id); });
    });
    buildCategoryFilter();
  }

  function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function number(n){ return Number(n||0).toFixed(2); }

  function saveItem(e){
    if(e) e.preventDefault();
    const items = read();
    const id = idI.value || uid();
    const item = { id, name: nameI.value.trim(), category: catI.value.trim(), quantity: Number(qtyI.value||0), price: Number(priceI.value||0), description: descI.value.trim() };
    const idx = items.findIndex(x=>x.id===id);
    if(idx>-1) items[idx]=item; else items.push(item);
    write(items);
    form.reset();
    idI.value = "";
    render();
    toast("Saved ✓");
  }

  function loadForEdit(id){
    const items = read();
    const it = items.find(x=>x.id===id);
    if(!it) return toast("Item not found");
    idI.value = it.id;
    nameI.value = it.name;
    catI.value = it.category;
    qtyI.value = it.quantity;
    priceI.value = it.price;
    descI.value = it.description;
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function removeItem(id){
    const items = read().filter(x=>x.id!==id);
    write(items);
    render();
    toast("Deleted ✓");
  }

  function buildCategoryFilter(){
    const cats = Array.from(new Set(read().map(x=>x.category||'').filter(Boolean))).sort();
    filterCat.innerHTML = '<option value="">All categories</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  }

  function exportJSON(){
    const items = read();
    const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inventory-export.json"; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file){
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        const data = JSON.parse(e.target.result);
        if(!Array.isArray(data)) throw new Error("Invalid file");
        write(data);
        render();
        toast("Imported " + data.length + " items.");
      }catch(err){
        toast("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function clearAll(){
    if(!confirm("Clear ALL inventory? This cannot be undone.")) return;
    localStorage.removeItem(LS_KEY);
    render();
    toast("Cleared all data");
  }

  function toast(msg){
    // lightweight toast
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.position="fixed";
    t.style.right="18px";
    t.style.bottom="18px";
    t.style.padding="10px 14px";
    t.style.background="linear-gradient(90deg,var(--accent2),var(--accent3))";
    t.style.color="#fff";
    t.style.borderRadius="10px";
    t.style.boxShadow="0 8px 20px rgba(16,24,40,0.12)";
    document.body.appendChild(t);
    setTimeout(()=> t.style.opacity=0,1600);
    setTimeout(()=> t.remove(),2000);
  }

  // events
  form.addEventListener("submit", saveItem);
  resetBtn.addEventListener("click", ()=>{ form.reset(); idI.value=''; });
  searchI.addEventListener("input", render);
  filterCat.addEventListener("change", render);
  exportBtn.addEventListener("click", exportJSON);
  importBtn.addEventListener("click", ()=> importFile.click());
  importFile.addEventListener("change", e=> { if(e.target.files[0]) handleImportFile(e.target.files[0]); e.target.value=''; });
  clearBtn.addEventListener("click", clearAll);

  // initial seed (only if empty)
  function seedIfEmpty(){
    const items = read();
    if(items.length===0){
      const sample = [
        { id: uid(), name:"AA Batteries Pack", category:"Electronics", quantity:50, price:120, description:"Duracell style" },
        { id: uid(), name:"A4 Notebook - Ruled", category:"Stationery", quantity:200, price:25, description:"College notebooks" },
        { id: uid(), name:"HDMI Cable", category:"Electronics", quantity:40, price:150, description:"2m cable" },
        { id: uid(), name:"Plywood Sheet 8mm", category:"Raw Material", quantity:10, price:1500, description:"8mm plywood" }
      ];
      write(sample);
    }
  }

  seedIfEmpty();
  render();

  // Expose for dashboard
  window.InventoryAPI = {
    list: read
  };
})();
