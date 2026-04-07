'use client'
import { useEffect, useRef, useState } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ── agent definitions ─────────────────────────────────────────────────────────
const AGENT_DEFS: Record<string, { bodyColor:string; shirtColor:string; hairColor:string; role:string; building:string; buildingColor:string }> = {
  orion:      { bodyColor:'#f5c89a', shirtColor:'#fbbf24', hairColor:'#1a1a1a', role:'Queen Intelligence', building:'Orion Palace',    buildingColor:'#fbbf24' },
  forge:      { bodyColor:'#f5c89a', shirtColor:'#fb923c', hairColor:'#7c3f00', role:'Agent Builder',     building:'Forge Workshop',   buildingColor:'#fb923c' },
  guardian:   { bodyColor:'#f5c89a', shirtColor:'#dc2626', hairColor:'#1a1a1a', role:'Security',          building:'Guardian Tower',   buildingColor:'#dc2626' },
  veritas:    { bodyColor:'#f5c89a', shirtColor:'#818cf8', hairColor:'#4b2990', role:'Quality',           building:'Veritas Lab',      buildingColor:'#818cf8' },
  nexus:      { bodyColor:'#f5c89a', shirtColor:'#34d399', hairColor:'#1a4a3a', role:'Automation',        building:'Nexus Hub',        buildingColor:'#34d399' },
  intake:     { bodyColor:'#f5c89a', shirtColor:'#4ade80', hairColor:'#1a1a1a', role:'Lead Intake',       building:'Intake Office',    buildingColor:'#4ade80' },
  research:   { bodyColor:'#f5c89a', shirtColor:'#60a5fa', hairColor:'#1a1a1a', role:'Research',          building:'Research Lab',     buildingColor:'#60a5fa' },
  operations: { bodyColor:'#f5c89a', shirtColor:'#f97316', hairColor:'#4a2000', role:'Operations',        building:'Ops Centre',       buildingColor:'#f97316' },
  client:     { bodyColor:'#f5c89a', shirtColor:'#ec4899', hairColor:'#1a1a1a', role:'Client Relations',  building:'Client Suite',     buildingColor:'#ec4899' },
  analyst:    { bodyColor:'#f5c89a', shirtColor:'#a78bfa', hairColor:'#2a1a6a', role:'Analytics',         building:'Analytics Tower',  buildingColor:'#a78bfa' },
  compliance: { bodyColor:'#f5c89a', shirtColor:'#ef4444', hairColor:'#1a1a1a', role:'Compliance',        building:'Compliance Court', buildingColor:'#ef4444' },
  content:    { bodyColor:'#f5c89a', shirtColor:'#C9A84C', hairColor:'#3a2000', role:'Content',           building:'Content Studio',   buildingColor:'#C9A84C' },
}

const TILE = { GRASS:0, ROAD_H:1, ROAD_V:2, ROAD_X:3, BUILDING:4, TREE:5, FLOWER:6, WATER:7, PLAZA:8 }
const TS = 32, MW = 40, MH = 28

const BP: Record<string, {tx:number;ty:number;w:number;h:number}> = {
  orion:{tx:17,ty:8,w:3,h:2},   forge:{tx:1,ty:1,w:3,h:2},    guardian:{tx:30,ty:1,w:3,h:2},
  veritas:{tx:1,ty:14,w:3,h:2}, nexus:{tx:30,ty:14,w:3,h:2},  intake:{tx:10,ty:1,w:3,h:2},
  research:{tx:20,ty:1,w:3,h:2},operations:{tx:10,ty:8,w:3,h:2},client:{tx:30,ty:8,w:3,h:2},
  analyst:{tx:10,ty:22,w:3,h:2},compliance:{tx:20,ty:22,w:3,h:2},content:{tx:30,ty:22,w:3,h:2},
}

const MSGS: Record<string, string[]> = {
  orion:['Optimising…','Network stable','Intelligence rising','Strategy updated'],
  forge:['Building agent…','Market gap found!','New agent ready!','Crafting prompt…'],
  guardian:['All clear','Scanning…','Threat blocked!','Network secure'],
  veritas:['Quality: 94%','Response verified','Checking accuracy…','Hallucination caught!'],
  nexus:['Workflow triggered','Automation running','Task automated!','Schedule updated'],
  intake:['New lead!','Qualifying…','HOT LEAD! 🔥','Routing to human'],
  research:['Searching web…','Trend found!','Intel gathered','Report ready'],
  operations:['Task complete','Workflow done','Process optimised','Reminder sent'],
  client:['Client happy!','Churn risk!','Relationship built','NPS: 9/10'],
  analyst:['ROI: 12x','Pattern found!','Forecast ready','Anomaly detected'],
  compliance:['Compliant ✓','Risk flagged!','Regulation met','Policy checked'],
  content:['Content live!','Copy approved','Post scheduled','Campaign sent'],
}

// ── types ──────────────────────────────────────────────────────────────────────
interface Agent { id:string;x:number;y:number;tx:number;ty:number;frame:number;frameTimer:number;facing:string;state:string;message:string;messageTimer:number;walkPath:{x:number;y:number}[];pathTimer:number;conversations:number;level:number }
interface Visitor { id:string;x:number;y:number;tx:number;ty:number;targetAgent:string;state:string;message:string;messageTimer:number;frame:number;frameTimer:number }
interface Particle { x:number;y:number;vx:number;vy:number;life:number;maxLife:number;color:string;char:string }

function generateMap(): number[][] {
  const m: number[][] = Array(MH).fill(null).map(()=>Array(MW).fill(TILE.GRASS))
  for (let x=0;x<MW;x++){m[6][x]=TILE.ROAD_H;m[13][x]=TILE.ROAD_H;m[20][x]=TILE.ROAD_H}
  for (let y=0;y<MH;y++){m[y][8]=TILE.ROAD_V;m[y][18]=TILE.ROAD_V;m[y][28]=TILE.ROAD_V}
  [[6,8],[6,18],[6,28],[13,8],[13,18],[13,28],[20,8],[20,18],[20,28]].forEach(([y,x])=>{m[y][x]=TILE.ROAD_X})
  for (let y=11;y<=15;y++) for (let x=16;x<=20;x++) if(m[y][x]===TILE.GRASS) m[y][x]=TILE.PLAZA
  for (let y=0;y<MH;y++) for (let x=0;x<MW;x++) if(m[y][x]===TILE.GRASS&&Math.random()<0.06) m[y][x]=Math.random()<0.5?TILE.TREE:TILE.FLOWER
  return m
}

function drawChar(ctx: CanvasRenderingContext2D, x:number, y:number, def:typeof AGENT_DEFS[string]|null, facing:string, frame:number, isClient=false) {
  const px=Math.floor(x), py=Math.floor(y)
  const body=isClient?'#e8c9a0':(def?.bodyColor||'#f5c89a')
  const shirt=isClient?'#6ea8d4':(def?.shirtColor||'#888')
  const hair=isClient?'#8B4513':(def?.hairColor||'#333')
  const pants=isClient?'#2d5a87':'#1a3a1a'
  const bob=frame%2===0?0:-1
  const lL=frame%4<2?1:-1

  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.beginPath();ctx.ellipse(px,py+14,6,2,0,0,Math.PI*2);ctx.fill()
  ctx.fillStyle=pants;ctx.fillRect(px-3,py+7+bob,3,6);ctx.fillRect(px+1,py+7+bob,3,6)
  ctx.fillStyle='#2a1a0a';ctx.fillRect(px-4,py+12+bob,3,2);ctx.fillRect(px,py+12+bob,3,2)
  ctx.fillStyle=shirt;ctx.fillRect(px-4,py-1+bob,8,8)
  ctx.fillStyle=shirt;ctx.fillRect(px-6,py+lL+bob,2,5);ctx.fillRect(px+4,py-lL+bob,2,5)
  ctx.fillStyle=body;ctx.fillRect(px-6,py+4+bob,2,2);ctx.fillRect(px+4,py+4+bob,2,2)
  ctx.fillStyle=body;ctx.fillRect(px-1,py-3+bob,2,3)
  ctx.fillStyle=body;ctx.fillRect(px-4,py-10+bob,8,8)
  ctx.fillStyle=hair;ctx.fillRect(px-4,py-10+bob,8,3)
  if(facing!=='up'){ctx.fillRect(px-5,py-9+bob,2,5);ctx.fillRect(px+3,py-9+bob,2,5)}
  if(facing!=='up'){
    ctx.fillStyle='#1a1a1a';ctx.fillRect(px-2,py-6+bob,1,2);ctx.fillRect(px+1,py-6+bob,1,2)
    ctx.fillStyle='#fff';ctx.fillRect(px-1,py-6+bob,1,1);ctx.fillRect(px+2,py-6+bob,1,1)
    ctx.fillStyle='#c07060';ctx.fillRect(px-1,py-4+bob,2,1)
  }
}

function drawBuilding(ctx:CanvasRenderingContext2D, tx:number,ty:number,w:number,h:number,color:string,name:string,isActive:boolean,tod:number) {
  const x=tx*TS,y=ty*TS,pw=w*TS,ph=h*TS
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x+4,y+4,pw,ph)
  ctx.fillStyle='#1a1a2a';ctx.fillRect(x,y,pw,ph)
  ctx.fillStyle='#222235';for(let wy=y+4;wy<y+ph-4;wy+=8)ctx.fillRect(x+4,wy,pw-8,4)
  ctx.fillStyle=color;ctx.fillRect(x,y,pw,8)
  ctx.fillStyle=`${color}aa`;ctx.fillRect(x,y+8,pw,4)
  const wLight=isActive&&(tod<0.3||tod>0.7)?`${color}cc`:isActive?`${color}66`:'#111122'
  ctx.fillStyle=wLight;ctx.fillRect(x+6,y+14,8,6);ctx.fillRect(x+pw-14,y+14,8,6)
  if(isActive&&(tod<0.3||tod>0.7)){
    const g=ctx.createRadialGradient(x+10,y+17,0,x+10,y+17,20)
    g.addColorStop(0,`${color}44`);g.addColorStop(1,'transparent')
    ctx.fillStyle=g;ctx.fillRect(x-10,y+7,40,40)
  }
  ctx.fillStyle='#3a2a1a';ctx.fillRect(x+pw/2-4,y+ph-10,8,10)
  ctx.fillStyle='#C9A84C';ctx.fillRect(x+pw/2+2,y+ph-7,2,2)
  ctx.font=`bold ${Math.min(9,pw/name.length*1.2)}px DM Sans,sans-serif`
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(name,x+pw/2,y-2)
  if(isActive){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x+pw-4,y+4,3,0,Math.PI*2);ctx.fill()}
}

function drawTile(ctx:CanvasRenderingContext2D, tile:number, x:number, y:number, tod:number) {
  const px=x*TS,py=y*TS,S=TS
  if(tile===TILE.GRASS){
    const g=Math.floor(40+Math.sin(x*3.7+y*2.3)*8)
    ctx.fillStyle=`rgb(${g},${g+30},${g})`;ctx.fillRect(px,py,S,S)
    if((x+y)%3===0){ctx.fillStyle=`rgb(${g+10},${g+40},${g+10})`;ctx.fillRect(px+4,py+6,2,4);ctx.fillRect(px+10,py+3,2,5)}
  } else if(tile===TILE.ROAD_H){
    ctx.fillStyle='#2a2a35';ctx.fillRect(px,py,S,S)
    ctx.fillStyle='#C9A84C44';ctx.fillRect(px+4,py+S/2-1,S-8,1)
  } else if(tile===TILE.ROAD_V){
    ctx.fillStyle='#2a2a35';ctx.fillRect(px,py,S,S)
    ctx.fillStyle='#C9A84C44';ctx.fillRect(px+S/2-1,py+4,1,S-8)
  } else if(tile===TILE.ROAD_X){
    ctx.fillStyle='#2a2a35';ctx.fillRect(px,py,S,S)
    ctx.fillStyle='#C9A84C33';ctx.fillRect(px+8,py+8,S-16,S-16)
  } else if(tile===TILE.PLAZA){
    ctx.fillStyle='#3a3530';ctx.fillRect(px,py,S,S)
    ctx.fillStyle='#4a4540';for(let i=0;i<S;i+=8){ctx.fillRect(px+i,py,1,S);ctx.fillRect(px,py+i,S,1)}
  } else if(tile===TILE.TREE){
    ctx.fillStyle='#2a4a2a';ctx.fillRect(px,py,S,S)
    ctx.fillStyle='#5a3a1a';ctx.fillRect(px+S/2-3,py+S/2,6,S/2)
    ctx.fillStyle='#1a6a1a';ctx.beginPath();ctx.arc(px+S/2,py+S/2-2,10,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#2a8a2a';ctx.beginPath();ctx.arc(px+S/2,py+S/2-6,8,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#3aaa3a';ctx.beginPath();ctx.arc(px+S/2,py+S/2-9,5,0,Math.PI*2);ctx.fill()
  } else if(tile===TILE.FLOWER){
    ctx.fillStyle='#3a6a3a';ctx.fillRect(px,py,S,S)
    const fc=['#ff6688','#ffaa44','#ff44aa','#44aaff','#ffff44'][(x+y)%5]
    ctx.fillStyle=fc;ctx.beginPath();ctx.arc(px+S/2,py+S/2,4,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#ffff88';ctx.beginPath();ctx.arc(px+S/2,py+S/2,2,0,Math.PI*2);ctx.fill()
  } else if(tile===TILE.WATER){
    const wave=Math.sin(Date.now()/800+x+y)*0.1
    ctx.fillStyle=`hsl(210,70%,${30+wave*10}%)`;ctx.fillRect(px,py,S,S)
  }
  void tod
}

// ── component ─────────────────────────────────────────────────────────────────
export default function WorldPage() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const agentsRef  = useRef<Record<string,Agent>>({})
  const visitorsRef= useRef<Visitor[]>([])
  const partsRef   = useRef<Particle[]>([])
  const mapRef     = useRef<number[][]>(generateMap())
  const camRef     = useRef({x:0,y:0})
  const timeRef    = useRef(0)
  // mutable refs read by rAF loop — changed by UI without restarting loop
  const selRef     = useRef<string|null>(null)
  const weatherRef = useRef<'clear'|'rain'|'storm'>('clear')
  const chatQRef   = useRef<{agent:string;msg:string;color:string}[]>([])
  // exposed for realtime useEffect
  const spawnRef   = useRef<(x:number,y:number,c:string,n?:number)=>void>(()=>{})
  const roadRef    = useRef<(fx:number,fy:number,tx:number,ty:number)=>{x:number,y:number}[]>(()=>[])

  // React state — display only, never set from rAF
  const [tod, setTod]         = useState(0.5)
  const [wx, setWx]           = useState<'clear'|'rain'|'storm'>('clear')
  const [sel, setSel]         = useState<string|null>(null)
  const [stats, setStats]     = useState({agents:12,visitors:0})
  const [chatLog, setChatLog] = useState<{agent:string;msg:string;color:string}[]>([])

  const supabase = createClientSupabase()

  // ── main effect — EVERYTHING in here, no useCallback ──────────────────────
  useEffect(() => {
    if (!canvasRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const canvas = canvasRef.current!
    let raf = 0

    // init agents
    Object.keys(AGENT_DEFS).forEach(id => {
      const bp = BP[id]; if (!bp) return
      agentsRef.current[id] = {
        id, x:bp.tx*TS+TS, y:bp.ty*TS+TS*1.5, tx:bp.tx*TS+TS, ty:bp.ty*TS+TS*1.5,
        frame:0, frameTimer:0, facing:'down', state:'idle', message:'', messageTimer:0,
        walkPath:[], pathTimer:Math.random()*200,
        conversations:Math.floor(Math.random()*500), level:Math.floor(Math.random()*5)+1
      }
    })

    function spawn(x:number,y:number,color:string,n=5) {
      const chars=['✦','♥','♪','★','•']
      for(let i=0;i<n;i++) partsRef.current.push({x,y,vx:(Math.random()-0.5)*3,vy:-Math.random()*3-1,life:1,maxLife:60+Math.random()*40,color,char:chars[Math.floor(Math.random()*chars.length)]})
      if(partsRef.current.length>200) partsRef.current=partsRef.current.slice(-150)
    }
    spawnRef.current = spawn

    function getRoad(fx:number,fy:number,tx:number,ty:number) {
      const rY=[6,13,20].map(r=>r*TS+TS/2)
      const rX=[8,18,28].map(r=>r*TS+TS/2)
      const nY=rY.reduce((a,b)=>Math.abs(a-fy)<Math.abs(b-fy)?a:b)
      const nX=rX.reduce((a,b)=>Math.abs(a-tx)<Math.abs(b-tx)?a:b)
      return [{x:fx,y:nY},{x:nX,y:nY},{x:nX,y:ty},{x:tx,y:ty}]
    }
    roadRef.current = getRoad

    function updateAgents() {
      Object.values(agentsRef.current).forEach(a => {
        const def=AGENT_DEFS[a.id]; if(!def)return
        a.frameTimer++; if(a.frameTimer>8){a.frame=(a.frame+1)%4;a.frameTimer=0}
        const dx=a.tx-a.x,dy=a.ty-a.y,dist=Math.hypot(dx,dy)
        if(dist>2){
          const spd=1.2; a.x+=dx/dist*spd; a.y+=dy/dist*spd
          a.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')
          a.state='walking'
        } else {
          a.pathTimer--
          if(a.walkPath.length>0){const n=a.walkPath.shift()!;a.tx=n.x;a.ty=n.y}
          else if(a.pathTimer<=0){
            a.pathTimer=150+Math.random()*300
            if(Math.random()<0.3){
              const px=18*TS+Math.random()*2*TS,py=12*TS+Math.random()*2*TS
              a.walkPath=getRoad(a.x,a.y,px,py)
            } else {
              const bp=BP[a.id]
              if(bp){a.tx=bp.tx*TS+(Math.random()-0.5)*2*TS+TS;a.ty=bp.ty*TS+(Math.random()-0.5)*2*TS+TS*1.5}
            }
            const msgs=MSGS[a.id]||['Working…']
            a.message=msgs[Math.floor(Math.random()*msgs.length)]
            a.messageTimer=120; a.state='talking'
            if(Math.random()<0.3) spawn(a.x,a.y-20,def.shirtColor,3)
            chatQRef.current.unshift({agent:a.id,msg:a.message,color:def.shirtColor})
            if(chatQRef.current.length>20) chatQRef.current=chatQRef.current.slice(0,20)
          } else {a.state='idle';a.facing='down'}
        }
        if(a.messageTimer>0){a.messageTimer--;if(a.messageTimer===0)a.message=''}
      })
    }

    function updateVisitors() {
      visitorsRef.current=visitorsRef.current.filter(v=>{
        v.frameTimer++;if(v.frameTimer>10){v.frame=(v.frame+1)%4;v.frameTimer=0}
        const dx=v.tx-v.x,dy=v.ty-v.y,dist=Math.hypot(dx,dy)
        if(dist>2){v.x+=dx/dist*1.5;v.y+=dy/dist*1.5}
        else if(v.state==='walking'){
          v.state='talking';v.messageTimer=200
          const a=agentsRef.current[v.targetAgent]
          if(a){a.state='talking';a.message='Helping client…';a.messageTimer=180;spawn(a.x,a.y-20,AGENT_DEFS[v.targetAgent]?.shirtColor||'#fff',4)}
        } else if(v.state==='talking'){
          v.messageTimer--
          if(v.messageTimer<=0){v.state='leaving';v.tx=-100}
        }
        return !(v.state==='leaving'&&v.x<-60)
      })
    }

    function draw() {
      raf=requestAnimationFrame(draw)
      const ctx=canvas.getContext('2d')
      if(!ctx||canvas.width<10)return
      const W=canvas.width,H=canvas.height
      timeRef.current++

      const t=((Date.now()/1000/1800)%1)
      let sR=7,sG=7,sB=30
      if(t>0.3&&t<0.75){const p=(t-0.3)/0.45;sR=Math.floor(50+p*107);sG=Math.floor(30+p*77);sB=Math.floor(80+p*20-p*50)}
      ctx.fillStyle=`rgb(${sR},${sG},${sB})`;ctx.fillRect(0,0,W,H)

      const camX=Math.max(0,Math.min(MW*TS-W,MW*TS/2-W/2))
      const camY=Math.max(0,Math.min(MH*TS-H,MH*TS/2-H/2))
      camRef.current={x:camX,y:camY}
      ctx.save();ctx.translate(-camX,-camY)

      // tiles
      const map=mapRef.current
      const sX=Math.floor(camX/TS),eX=Math.min(MW,Math.ceil((camX+W)/TS)+1)
      const sY=Math.floor(camY/TS),eY=Math.min(MH,Math.ceil((camY+H)/TS)+1)
      for(let ty=sY;ty<eY;ty++) for(let tx=sX;tx<eX;tx++) drawTile(ctx,map[ty][tx],tx,ty,t)

      // buildings
      Object.entries(BP).forEach(([id,bp])=>{
        const def=AGENT_DEFS[id],a=agentsRef.current[id]
        if(!def)return
        drawBuilding(ctx,bp.tx,bp.ty,bp.w,bp.h,def.buildingColor,def.building,a?.state!=='idle',t)
      })

      // stars
      if(t<0.3||t>0.75){
        const sa=Math.min(0.8,t<0.3?(0.3-t)/0.1*0.8:(t-0.75)/0.1*0.8)
        for(let i=0;i<60;i++){
          const tw=Math.sin(timeRef.current*0.05+i)*0.3+0.7
          ctx.fillStyle=`rgba(255,255,220,${sa*tw})`
          ctx.beginPath();ctx.arc((i*137+50)%(MW*TS),(i*97+30)%(MH*TS/2),1.5,0,Math.PI*2);ctx.fill()
        }
      }

      // sun
      if(t>0.3&&t<0.75){
        const sx=MW*TS*((t-0.3)/0.45),sy=60-Math.sin((t-0.3)/0.45*Math.PI)*40
        const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,30)
        sg.addColorStop(0,'#fffacc');sg.addColorStop(0.3,'#ffd700cc');sg.addColorStop(1,'transparent')
        ctx.fillStyle=sg;ctx.fillRect(sx-30,sy-30,60,60)
      }

      // rain
      const w=weatherRef.current
      if(w==='rain'||w==='storm'){
        ctx.strokeStyle=`rgba(150,180,255,${w==='storm'?0.6:0.3})`;ctx.lineWidth=1
        for(let i=0;i<100;i++){
          const rx=(i*173+timeRef.current*3)%(MW*TS),ry=(i*97+timeRef.current*5)%(MH*TS)
          ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-2,ry+8);ctx.stroke()
        }
      }

      updateAgents();updateVisitors()

      // sort & draw entities by Y
      const items:Array<{y:number;fn:()=>void}>=[]
      Object.values(agentsRef.current).forEach(a=>{
        const def=AGENT_DEFS[a.id];if(!def)return
        items.push({y:a.y,fn:()=>{
          if(selRef.current===a.id){ctx.strokeStyle=def.shirtColor;ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y+6,14,0,Math.PI*2);ctx.stroke()}
          drawChar(ctx,a.x,a.y,def,a.facing,a.frame)
          ctx.font='bold 8px DM Sans';ctx.fillStyle=def.shirtColor;ctx.textAlign='center';ctx.textBaseline='top'
          ctx.fillText(a.id.toUpperCase(),a.x,a.y+16)
          if(a.message){
            ctx.font='9px DM Sans,sans-serif'
            const tw2=ctx.measureText(a.message).width,bw=tw2+12,bh=16,bx=a.x-bw/2,by=a.y-35
            ctx.fillStyle='rgba(10,10,20,0.92)';ctx.strokeStyle=def.shirtColor;ctx.lineWidth=1.5
            ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();ctx.stroke()
            ctx.fillStyle='rgba(10,10,20,0.92)';ctx.beginPath();ctx.moveTo(a.x-3,by+bh);ctx.lineTo(a.x+3,by+bh);ctx.lineTo(a.x,by+bh+5);ctx.closePath();ctx.fill()
            ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a.message,a.x,by+bh/2)
          }
        }})
      })
      visitorsRef.current.forEach(v=>{
        items.push({y:v.y,fn:()=>{
          drawChar(ctx,v.x,v.y,null,'down',v.frame,true)
          if(v.state==='talking'&&v.message){
            ctx.font='9px DM Sans';const tw2=ctx.measureText(v.message).width,bw=tw2+12,bh=16,bx=v.x-bw/2,by=v.y-35
            ctx.fillStyle='rgba(20,20,40,0.92)';ctx.strokeStyle='#6ea8d4';ctx.lineWidth=1.5
            ctx.beginPath();ctx.roundRect(bx,by,bw,bh,4);ctx.fill();ctx.stroke()
            ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(v.message,v.x,by+bh/2)
          }
        }})
      })
      items.sort((a,b)=>a.y-b.y);items.forEach(i=>i.fn())

      // particles
      partsRef.current=partsRef.current.filter(p=>p.life>0)
      partsRef.current.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy-=0.05;p.life-=1/p.maxLife
        ctx.font=`${Math.floor(10*p.life)}px serif`
        ctx.fillStyle=`${p.color}${Math.floor(p.life*255).toString(16).padStart(2,'0')}`
        ctx.textAlign='center';ctx.fillText(p.char,p.x,p.y)
      })

      // night overlay
      if(t<0.3||t>0.75){
        const na=Math.min(0.5,t<0.3?(0.3-t)/0.1*0.5:(t-0.75)/0.1*0.5)
        ctx.fillStyle=`rgba(0,0,20,${na})`;ctx.fillRect(camX,camY,W,H)
      }
      ctx.restore()
    }

    function resize() {
      const W=canvas.offsetWidth,H=canvas.offsetHeight
      if(W<10||H<10)return
      canvas.width=W;canvas.height=H
    }

    resize()
    window.addEventListener('resize',resize)
    draw()

    // stats sync — 1x/sec only, never from rAF
    const interval=setInterval(()=>{
      setTod(((Date.now()/1000/1800)%1))
      setStats({agents:Object.keys(agentsRef.current).length,visitors:visitorsRef.current.length})
      setSel(selRef.current)
      if(chatQRef.current.length>0){
        const q=chatQRef.current.splice(0,chatQRef.current.length)
        setChatLog(prev=>[...q,...prev].slice(0,7))
      }
    },1000)

    function onClick(e:MouseEvent){
      const rect=canvas.getBoundingClientRect()
      const mx=e.clientX-rect.left+camRef.current.x,my=e.clientY-rect.top+camRef.current.y
      const hit=Object.values(agentsRef.current).find(a=>Math.hypot(mx-a.x,my-a.y)<20)
      selRef.current=hit?.id===selRef.current?null:(hit?.id||null)
      if(hit){hit.state='celebrating';spawn(hit.x,hit.y-20,AGENT_DEFS[hit.id]?.shirtColor||'#fff',6)}
    }
    canvas.addEventListener('click',onClick)

    return ()=>{
      cancelAnimationFrame(raf)
      clearInterval(interval)
      window.removeEventListener('resize',resize)
      canvas.removeEventListener('click',onClick)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // ── realtime ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const ch=supabase.channel('world-live')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'syndicate_messages'},(payload)=>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg=payload.new as any
        const from=agentsRef.current[msg.from_agent]
        if(from){
          from.state='talking';from.message=msg.message_type?.replace(/_/g,' ')||'transmitting…';from.messageTimer=150
          spawnRef.current(from.x,from.y-20,AGENT_DEFS[msg.from_agent]?.shirtColor||'#fff',4)
          const to=agentsRef.current[msg.to_agent]
          if(to&&Math.hypot(to.x-from.x,to.y-from.y)<200&&Math.random()<0.4)
            from.walkPath=roadRef.current(from.x,from.y,to.x-20,to.y)
        }
        if(msg.flagged_by_guardian){
          const g=agentsRef.current['guardian']
          if(g){g.message='THREAT BLOCKED! 🚨';g.messageTimer=200;g.state='talking';spawnRef.current(g.x,g.y,'#dc2626',8)}
        }
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'conversations'},(payload)=>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c=payload.new as any
        const ta=c.agent_type||'intake',bp=BP[ta];if(!bp)return
        visitorsRef.current.push({id:`v${Date.now()}`,x:-40,y:13*TS,tx:bp.tx*TS+TS,ty:bp.ty*TS+TS*2,targetAgent:ta,state:'walking',message:'I need help…',messageTimer:0,frame:0,frameTimer:0})
      })
      .subscribe()
    return ()=>{supabase.removeChannel(ch)}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const selDef=sel?AGENT_DEFS[sel]:null
  const selData=sel?agentsRef.current[sel]:null
  const todLabel=tod<0.25?'🌙 Night':tod<0.35?'🌅 Dawn':tod<0.6?'☀️ Day':tod<0.75?'🌇 Sunset':'🌙 Night'

  return (
    <div style={{height:'100vh',background:'#070707',display:'flex',flexDirection:'column',fontFamily:'DM Sans,sans-serif',overflow:'hidden'}}>
      <div style={{background:'#0d0d0d',borderBottom:'1px solid #1a1a1a',padding:'10px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:'#C9A84C',fontWeight:700,fontSize:16,letterSpacing:2,fontFamily:'Bebas Neue,sans-serif'}}>✦ LYCHO WORLD</span>
          <span style={{color:'#444',fontSize:11}}>Live Agent Society</span>
          <span style={{color:'#666',fontSize:12}}>{todLabel} {wx==='clear'?'☀️':wx==='rain'?'🌧️':'⛈️'}</span>
        </div>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          {[{label:'Agents',value:stats.agents},{label:'Visitors',value:stats.visitors}].map(s=>(
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{color:'#C9A84C',fontWeight:700,fontSize:18,fontFamily:'Bebas Neue,sans-serif'}}>{s.value}</div>
              <div style={{color:'#444',fontSize:10}}>{s.label}</div>
            </div>
          ))}
          <div style={{display:'flex',gap:6}}>
            {(['clear','rain','storm'] as const).map(w=>(
              <button key={w} onClick={()=>{weatherRef.current=w;setWx(w)}}
                style={{background:wx===w?'#C9A84C':'#141414',color:wx===w?'#070707':'#666',border:'1px solid #2a2a2a',borderRadius:4,padding:'4px 8px',cursor:'pointer',fontSize:11}}>
                {w==='clear'?'☀️':w==='rain'?'🌧️':'⛈️'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{flex:1,cursor:'crosshair',imageRendering:'pixelated',display:'block'}} />

        <div style={{width:220,background:'#0d0d0d',borderLeft:'1px solid #1a1a1a',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {selDef&&selData?(
            <div style={{padding:16,borderBottom:'1px solid #1a1a1a'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <span style={{color:selDef.shirtColor,fontWeight:700,fontSize:14}}>{sel?.toUpperCase()}</span>
                <button onClick={()=>{selRef.current=null;setSel(null)}} style={{background:'none',border:'none',color:'#444',cursor:'pointer'}}>×</button>
              </div>
              <div style={{color:'#666',fontSize:11,marginBottom:10}}>{selDef.role}</div>
              {[{label:'Building',value:selDef.building},{label:'State',value:selData.state.toUpperCase()},{label:'Level',value:'★'.repeat(selData.level)},{label:'Conversations',value:selData.conversations.toLocaleString()}].map(item=>(
                <div key={item.label} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid #111',fontSize:11}}>
                  <span style={{color:'#666'}}>{item.label}</span>
                  <span style={{color:'#fff'}}>{item.value}</span>
                </div>
              ))}
            </div>
          ):(
            <div style={{padding:16,borderBottom:'1px solid #1a1a1a',color:'#333',fontSize:11}}>Click any agent to inspect</div>
          )}

          <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 16px 6px',color:'#444',fontSize:10,fontWeight:700,letterSpacing:1}}>LIVE ACTIVITY</div>
            <div style={{flex:1,overflowY:'auto',padding:'0 12px 12px'}}>
              {chatLog.map((log,i)=>(
                <div key={i} style={{marginBottom:6,opacity:1-i*0.12}}>
                  <span style={{color:log.color,fontSize:10,fontWeight:700}}>{log.agent.toUpperCase()} </span>
                  <span style={{color:'#888',fontSize:10}}>{log.msg}</span>
                </div>
              ))}
              {chatLog.length===0&&<div style={{color:'#333',fontSize:11}}>Waiting for activity…</div>}
            </div>
          </div>

          <div style={{padding:12,borderTop:'1px solid #1a1a1a'}}>
            <div style={{color:'#444',fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:8}}>AGENTS</div>
            {Object.entries(AGENT_DEFS).slice(0,6).map(([id,def])=>(
              <div key={id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:def.shirtColor,flexShrink:0}}/>
                <span style={{color:def.shirtColor,fontSize:10,fontWeight:600}}>{id.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
