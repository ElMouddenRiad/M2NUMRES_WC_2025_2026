class MyPlaylist extends HTMLElement {
  static get observedAttributes(){ return ['tracks','data-tracks']; }

  attributeChangedCallback(name, oldValue, newValue){
    if(name === 'tracks' || name === 'data-tracks'){
      try{
        const arr = JSON.parse(newValue);
        if(Array.isArray(arr)){
          this.setTracks(arr);
        }
      }catch(e){
        console.warn('playlist: invalid JSON for tracks attribute', e);
      }
    }
  }

  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this.tracks = [];
    this.current = -1;
    this.draggedIndex = null;
    this.render();
  }

  render(){
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${new URL('../css/playlist.css', import.meta.url)}">
      <ul id="list"></ul>
    `;
    const ul = this.shadowRoot.querySelector('#list');
    ul.addEventListener('dragover', (e)=>{
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    ul.addEventListener('drop', (e)=>{
      e.preventDefault();
      if(this.draggedIndex === null) return;
      const targetLi = e.target.closest('li');
      if(targetLi) return;
      const to = this.tracks.length - 1;
      if(to >= 0 && this.draggedIndex !== to){
        this.reorderTrack(this.draggedIndex, to);
      }
      this.onDragEnd(e);
    });
    this.updateList();
  }

  updateList(){
    const ul = this.shadowRoot.querySelector('#list');
    if(!ul) return;
    ul.innerHTML = '';
    this.tracks.forEach((t,i)=>{
      const li = document.createElement('li');
      li.dataset.index = i;
      li.draggable = true;
      li.tabIndex = 0;
      if(i===this.current) li.classList.add('current');
      
      const info = document.createElement('div');
      info.className = 'track-info';
      const title = document.createElement('div');
      title.className = 'track-title';
      title.textContent = t.title || `Track ${i+1}`;
      const dur = document.createElement('div');
      dur.className = 'track-dur';
      dur.textContent = t.duration ? `${this.formatTime(t.duration)}` : '';
      info.appendChild(title);
      if(dur.textContent) info.appendChild(dur);
      
      const actions = document.createElement('div');
      actions.className = 'track-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-del';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label','Delete track');
      delBtn.addEventListener('click', e=>{
        e.stopPropagation();
        this.removeTrack(i);
      });
      actions.appendChild(delBtn);
      
      li.appendChild(info);
      li.appendChild(actions);
      
      li.addEventListener('click', ()=>this.play(i));
      li.addEventListener('keydown', (e)=>{
        if(e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.play(i); }
        else if(e.code === 'Delete') { e.preventDefault(); this.removeTrack(i); }
      });
      li.addEventListener('dragstart', e=>this.onDragStart(e, i));
      li.addEventListener('dragover', e=>this.onDragOver(e, i));
      li.addEventListener('dragleave', e=>this.onDragLeave(e, i));
      li.addEventListener('drop', e=>this.onDrop(e, i));
      li.addEventListener('dragend', e=>this.onDragEnd(e));
      
      ul.appendChild(li);
    });

  }

  onDragStart(e, index){
    this.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(e, index){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const li = e.currentTarget;
    li.classList.add('drag-over');
  }

  onDragLeave(e, index){
    const li = e.currentTarget;
    li.classList.remove('drag-over');
  }

  onDrop(e, index){
    e.preventDefault();
    const li = e.currentTarget;
    li.classList.remove('drag-over');
    if(this.draggedIndex !== null && this.draggedIndex !== index){
      this.reorderTrack(this.draggedIndex, index);
    }
  }

  onDragEnd(e){
    this.draggedIndex = null;
    const items = this.shadowRoot.querySelectorAll('li');
    items.forEach(li=>li.classList.remove('drag-over'));
  }

  formatTime(sec){
    const m = Math.floor(sec/60);
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  setTracks(list){
    this.tracks = Array.isArray(list) ? list : [];
    this.current = -1;
    this.updateList();
  }

  play(index){
    if(index < 0 || index >= this.tracks.length) return;
    this.current = index;
    this.updateList();
    this.dispatchEvent(new CustomEvent('play-track', {detail:{index}, bubbles:true}));
  }

  highlight(index){
    this.current = index;
    this.updateList();
  }

  removeTrack(index){
    if(index < 0 || index >= this.tracks.length) return;
    const removed = this.tracks.splice(index, 1)[0];
    if(this.current === index) this.current = -1;
    else if(this.current > index) this.current--;
    this.updateList();
    this.dispatchEvent(new CustomEvent('playlist-changed', {detail:{action:'remove', index, track:removed}, bubbles:true}));
  }

  reorderTrack(from, to){
    if(from === to) return;
    const track = this.tracks[from];
    this.tracks.splice(from, 1);
    this.tracks.splice(to, 0, track);
    if(this.current === from) this.current = to;
    else if(from < this.current && to >= this.current) this.current--;
    else if(from > this.current && to <= this.current) this.current++;
    this.updateList();
    this.dispatchEvent(new CustomEvent('playlist-changed', {detail:{action:'reorder', from, to}, bubbles:true}));
  }

  nextIndex(){
    if(this.tracks.length === 0) return undefined;
    const nxt = this.current + 1;
    return nxt < this.tracks.length ? nxt : undefined;
  }

  previousIndex(){
    if(this.tracks.length === 0) return undefined;
    const prev = this.current - 1;
    return prev >= 0 ? prev : undefined;
  }

  getTracks(){
    return [...this.tracks];
  }

  addTrack(track){
    this.tracks.push(track);
    if((track.duration === undefined || track.duration === 0) && track.src){
      const tAudio = document.createElement('audio');
      tAudio.preload = 'metadata';
      tAudio.src = track.src;
      tAudio.addEventListener('loadedmetadata', ()=>{
        track.duration = tAudio.duration;
        this.updateList();
      });
    }
    this.updateList();
    this.dispatchEvent(new CustomEvent('playlist-changed', {detail:{action:'add', index:this.tracks.length-1, track}, bubbles:true}));
  }
}

customElements.define('my-playlist', MyPlaylist);
export default MyPlaylist;
