class MyVisualizer extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this.analyser = null;
    this._raf = null;
    this.mode = 'spectrum';
    this.frameRate = 30;
    this.canvasWidth = 900;
    this.canvasHeight = 180;
    this._freqData = null;
    this._timeData = null;
    this.build();
  }

  build(){
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${new URL('../css/visualizer.css', import.meta.url)}">
      <div class="top">
        <div><strong>Visualizer</strong></div>
        <div>
          <select id="mode">
            <option value="spectrum">Spectrum</option>
            <option value="waveform">Waveform</option>
          </select>
          <button id="startBtn">Start</button>
          <button id="stopBtn">Stop</button>
        </div>
      </div>
      <canvas id="cv" width="${this.canvasWidth}" height="${this.canvasHeight}"></canvas>
    `;
    this.canvas = this.shadowRoot.querySelector('#cv');
    this.ctx = this.canvas.getContext('2d');

    this.shadowRoot.querySelector('#startBtn').addEventListener('click', ()=>this.start());
    this.shadowRoot.querySelector('#stopBtn').addEventListener('click', ()=>this.stop());
    this.shadowRoot.querySelector('#mode').addEventListener('change', (e)=>{ this.mode = e.target.value; });
  }

  setAnalyser(node){
    this.analyser = node;
    if (!this.analyser) return;
    this._freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this._timeData = new Uint8Array(this.analyser.fftSize);
  }

  start(){
    if (!this.analyser) {
      console.warn('Visualizer: no analyser set');
      return;
    }
    if (this._raf) return;
    const fps = this.frameRate || 30;
    const minDt = 1000 / fps;
    let last = performance.now();

    const ctx2d = this.ctx;
    const canvas = this.canvas;
    const draw = () => {
      this._raf = requestAnimationFrame(draw);
      const now = performance.now();
      const dt = now - last;
      if (dt < minDt) return;
      last = now;

      const w = canvas.width;
      const h = canvas.height;
      ctx2d.clearRect(0,0,w,h);

      if (this.mode === 'spectrum'){
        this.analyser.getByteFrequencyData(this._freqData);
        const bars = 128;
        const step = Math.floor(this._freqData.length / bars) || 1;
        const barW = w / bars;
        ctx2d.fillStyle = '#9ad5ff';
        for (let i=0;i<bars;i++){
          let sum = 0;
          for (let j=0;j<step;j++) sum += this._freqData[i*step + j] || 0;
          const avg = sum / step;
          const v = avg / 255;
          const bh = v * h;
          ctx2d.fillRect(i*barW, h - bh, barW*0.9, bh);
        }
      } else {
        this.analyser.getByteTimeDomainData(this._timeData);
        ctx2d.strokeStyle = '#fff';
        ctx2d.beginPath();
        for (let i=0;i<this._timeData.length;i++){
          const v = (this._timeData[i] - 128) / 128;
          const x = (i / (this._timeData.length-1)) * w;
          const y = h/2 + v * (h/2);
          if (i===0) ctx2d.moveTo(x,y); else ctx2d.lineTo(x,y);
        }
        ctx2d.stroke();
      }
    };
    draw();
  }

  stop(){
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
  }
}

customElements.define('my-visualizer', MyVisualizer);
export default MyVisualizer;