import math,sys,os
OUT=sys.argv[1] if len(sys.argv)>1 else 'assets/images/criteria/src'
HEAD='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">'
SH='<filter id="sh" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".22"/></filter><filter id="sh2" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".2"/></filter>'
def sparkle(x,y,r,fill='#fff',op=.9):
    return f'<path d="M{x} {y-r} Q{x} {y} {x+r} {y} Q{x} {y} {x} {y+r} Q{x} {y} {x-r} {y} Q{x} {y} {x} {y-r}Z" fill="{fill}" opacity="{op}"/>'
def gear(cx,cy,r,fill,hole='#fff',teeth=8):
    g=f'<g transform="translate({cx} {cy})">'
    for i in range(teeth):
        g+=f'<rect x="{-r*0.2}" y="{-r*1.28}" width="{r*0.4}" height="{r*0.5}" rx="{r*0.08}" fill="{fill}" transform="rotate({i*360/teeth})"/>'
    g+=f'<circle r="{r}" fill="{fill}"/><circle r="{r*0.42}" fill="{hole}"/></g>'
    return g
# ---------------- 1. 料金 ----------------
def price():
    s=HEAD+'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#ff8440"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#f7b52b"/></linearGradient>'+SH+'</defs>'
    s+='<rect width="800" height="450" fill="url(#bg)"/><circle cx="700" cy="60" r="170" fill="#fff" opacity=".13"/><circle cx="60" cy="420" r="150" fill="#fff" opacity=".13"/>'
    # coin stacks
    def stack(cx,base,n,rx=62,ry=20,h=15):
        o=''
        for i in range(n):
            y=base-i*h
            o+=f'<rect x="{cx-rx}" y="{y}" width="{2*rx}" height="{h}" fill="#e08f10"/><ellipse cx="{cx}" cy="{y+h}" rx="{rx}" ry="{ry}" fill="#e08f10"/>'
            o+=f'<path d="M{cx-rx} {y+h*0.45} Q{cx} {y+h*0.45+ry*2} {cx+rx} {y+h*0.45}" fill="none" stroke="#fff0a0" stroke-width="1.5" opacity=".55"/>'
        y=base-(n-1)*h
        o+=f'<ellipse cx="{cx}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#gold)"/><ellipse cx="{cx}" cy="{y}" rx="{rx*0.72}" ry="{ry*0.7}" fill="none" stroke="#d98a0c" stroke-width="3" opacity=".7"/>'
        o+=f'<text x="{cx}" y="{y+9}" text-anchor="middle" font-size="26" font-weight="800" fill="#b86d00" font-family="sans-serif">¥</text>'
        return o
    s+='<g filter="url(#sh)">'+stack(385,372,3)+stack(500,372,6)+stack(615,372,10)+'</g>'
    # rising arrow
    s+='<g filter="url(#sh2)"><path d="M380 190 L470 140 L520 168 L640 80" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M600 70 L655 68 L653 125" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></g>'
    # calculator
    s+='<g transform="rotate(-8 175 250)" filter="url(#sh)"><rect x="75" y="95" width="200" height="270" rx="26" fill="#fff"/><rect x="95" y="115" width="160" height="62" rx="12" fill="#2b3150"/><text x="244" y="160" text-anchor="end" font-size="34" font-weight="800" fill="#7cf0b0" font-family="monospace">¥19,800</text>'
    cols=['#ffb347','#ff6b6b','#6c7bff','#2fc98e']
    for r in range(4):
        for c in range(4):
            col=cols[3] if (r==3 and c==3) else ('#e9edf5' if c<3 else cols[r%3])
            s+=f'<rect x="{95+c*41}" y="{195+r*41}" width="34" height="32" rx="9" fill="{col}"/>'
    s+='</g>'
    # price tag
    s+='<g transform="rotate(14 300 90)" filter="url(#sh2)"><path d="M250 50 L350 50 Q365 50 365 65 L365 125 Q365 140 350 140 L250 140 L215 95 Z" fill="#fff"/><circle cx="238" cy="95" r="8" fill="#ff9a3d"/><text x="302" y="112" text-anchor="middle" font-size="46" font-weight="800" fill="#ff7a1a" font-family="sans-serif">¥</text></g>'
    # floating coins
    for (x,y,r) in [(700,200,26),(745,300,20),(330,330,16)]:
        s+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#gold)" stroke="#d98a0c" stroke-width="3"/><text x="{x}" y="{y+r*0.35}" text-anchor="middle" font-size="{r*1.0}" font-weight="800" fill="#b86d00" font-family="sans-serif">¥</text>'
    s+=sparkle(180,60,16)+sparkle(560,40,12)+sparkle(760,380,14)
    return s+'</svg>'
# ---------------- 2. 福祉への理解 ----------------
def person(cx,cy,skin,cloth,hair,s=1.0,flip=1):
    o=f'<g transform="translate({cx} {cy}) scale({s})">'
    o+=f'<path d="M-46 60 Q-46 6 0 6 Q46 6 46 60 Z" fill="{cloth}"/><circle cx="0" cy="-26" r="30" fill="{skin}"/>'
    o+=f'<path d="M-32 -30 Q-30 -62 0 -62 Q32 -62 32 -30 Q14 -48 -32 -30Z" fill="{hair}"/>'
    o+='<circle cx="-10" cy="-24" r="3.2" fill="#3a2a22"/><circle cx="10" cy="-24" r="3.2" fill="#3a2a22"/><path d="M-8 -12 Q0 -5 8 -12" fill="none" stroke="#3a2a22" stroke-width="3" stroke-linecap="round"/>'
    return o+'</g>'
def welfare():
    s=HEAD+'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc09f"/><stop offset="1" stop-color="#ff5c8a"/></linearGradient><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffd5e0"/></linearGradient>'+SH+'</defs>'
    s+='<rect width="800" height="450" fill="url(#bg)"/><circle cx="90" cy="60" r="160" fill="#fff" opacity=".14"/><circle cx="730" cy="410" r="190" fill="#fff" opacity=".14"/>'
    # big heart
    s+='<g filter="url(#sh)"><path d="M400 318 C255 230 245 108 330 96 C372 90 396 118 400 146 C404 118 428 90 470 96 C555 108 545 230 400 318Z" fill="url(#hg)"/></g>'
    s+='<path d="M400 285 C300 220 296 140 345 132 C372 128 392 148 400 170 C408 148 428 128 455 132 C504 140 500 220 400 285Z" fill="#ff6f9c" opacity=".92"/>'
    s+='<path d="M360 190 L385 215 L440 160" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>'
    # people row
    s+='<g filter="url(#sh2)">'+person(110,330,'#ffd9bf','#3aa6ff','#5b3b2a',1.25)+person(235,360,'#c98e65','#ffd23f','#2a1c16',1.1)+person(565,360,'#ffe0cc','#2fc98e','#a05a2c',1.1)+person(690,330,'#e4a77c','#8b6bff','#1d1a28',1.25)+'</g>'
    # dotted links
    s+='<path d="M150 300 Q260 230 330 250" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/><path d="M650 300 Q540 230 470 250" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>'
    for (x,y,r) in [(170,150,18),(640,130,22),(130,240,12),(700,230,14)]:
        s+=f'<path d="M{x} {y+r*0.9} C{x-r*1.6} {y-r*0.1} {x-r*0.7} {y-r*1.2} {x} {y-r*0.3} C{x+r*0.7} {y-r*1.2} {x+r*1.6} {y-r*0.1} {x} {y+r*0.9}Z" fill="#fff" opacity=".85"/>'
    s+=sparkle(300,60,14)+sparkle(520,50,12)+sparkle(60,400,12)
    return s+'</svg>'
# ---------------- 3. デザイン ----------------
def design():
    s=HEAD+'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6bff"/><stop offset="1" stop-color="#17c3f0"/></linearGradient><linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#ff5e8a"/></linearGradient>'+SH+'</defs>'
    s+='<rect width="800" height="450" fill="url(#bg)"/><circle cx="720" cy="70" r="170" fill="#fff" opacity=".12"/><circle cx="60" cy="410" r="140" fill="#fff" opacity=".12"/>'
    # browser window
    s+='<g filter="url(#sh)" transform="rotate(-4 280 220)"><rect x="70" y="70" width="420" height="300" rx="20" fill="#fff"/><path d="M70 90 Q70 70 90 70 L470 70 Q490 70 490 90 L490 112 L70 112Z" fill="#eef0f7"/>'
    for i,c in enumerate(['#ff6b6b','#ffd23f','#2fc98e']): s+=f'<circle cx="{98+i*22}" cy="91" r="6" fill="{c}"/>'
    s+='<rect x="190" y="82" width="200" height="18" rx="9" fill="#fff"/>'
    s+='<rect x="92" y="128" width="376" height="104" rx="14" fill="url(#hero)"/><circle cx="410" cy="170" r="26" fill="#fff" opacity=".35"/><rect x="112" y="150" width="150" height="14" rx="7" fill="#fff"/><rect x="112" y="174" width="110" height="10" rx="5" fill="#fff" opacity=".7"/><rect x="112" y="196" width="76" height="24" rx="12" fill="#fff"/>'
    for i,c in enumerate(['#6c7bff','#2fc98e','#ffb347']):
        s+=f'<rect x="{92+i*128}" y="248" width="120" height="100" rx="12" fill="#f4f6fb"/><rect x="{102+i*128}" y="258" width="100" height="44" rx="8" fill="{c}"/><rect x="{102+i*128}" y="312" width="80" height="8" rx="4" fill="#cfd5e6"/><rect x="{102+i*128}" y="327" width="56" height="8" rx="4" fill="#cfd5e6"/>'
    s+='</g>'
    # palette card
    s+='<g transform="rotate(9 600 290)" filter="url(#sh)"><rect x="490" y="190" width="230" height="190" rx="22" fill="#fff"/>'
    cols=['#ff5e5e','#ffb347','#ffe14a','#2fc98e','#2fb7ff','#8a6bff']
    for i,c in enumerate(cols):
        s+=f'<circle cx="{530+(i%3)*66}" cy="{238+(i//3)*58}" r="24" fill="{c}"/>'
    s+='<rect x="512" y="330" width="186" height="14" rx="7" fill="#e6e9f3"/><rect x="512" y="330" width="120" height="14" rx="7" fill="#8a6bff"/></g>'
    # pencil
    s+='<g transform="translate(-70 10) rotate(38 690 110)" filter="url(#sh2)"><rect x="640" y="60" width="150" height="34" rx="6" fill="#ffd23f"/><path d="M640 60 L590 77 L640 94Z" fill="#ffe9b8"/><path d="M590 77 L612 69 L612 85Z" fill="#33384f"/><rect x="790" y="60" width="26" height="34" rx="6" fill="#ff8fab"/><rect x="765" y="60" width="10" height="34" fill="#c4c9d8"/></g>'
    # cursor
    s+='<g filter="url(#sh2)" transform="translate(440 300) rotate(-12)"><path d="M0 0 L0 68 L19 52 L32 82 L46 76 L33 47 L58 45Z" fill="#fff" stroke="#33384f" stroke-width="5" stroke-linejoin="round"/></g>'
    s+=sparkle(630,40,14)+sparkle(60,60,12)+sparkle(760,400,13)
    return s+'</svg>'
# ---------------- 4. 相談のしやすさ ----------------
def consult():
    s=HEAD+'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#18b6c9"/><stop offset="1" stop-color="#7be8b5"/></linearGradient>'+SH+'</defs>'
    s+='<rect width="800" height="450" fill="url(#bg)"/><circle cx="90" cy="60" r="170" fill="#fff" opacity=".13"/><circle cx="730" cy="400" r="190" fill="#fff" opacity=".13"/>'
    s+='<g filter="url(#sh2)">'+person(170,350,'#ffd9bf','#ff8a3d','#4a2f22',2.0)+person(630,350,'#e4a77c','#6c7bff','#1d1a28',2.0)+'</g>'
    # bubbles
    s+='<g filter="url(#sh)"><path d="M120 60 H360 Q385 60 385 85 V165 Q385 190 360 190 H250 L205 228 L212 190 H145 Q120 190 120 165 V85 Q120 60 145 60Z" fill="#fff"/></g>'
    s+='<rect x="148" y="88" width="190" height="14" rx="7" fill="#cfe9ef"/><rect x="148" y="114" width="150" height="14" rx="7" fill="#cfe9ef"/><rect x="148" y="140" width="100" height="14" rx="7" fill="#18b6c9"/>'
    s+='<g transform="translate(0 -70)"><g filter="url(#sh)"><path d="M440 150 H670 Q695 150 695 175 V235 Q695 260 670 260 H640 L630 300 L592 260 H465 Q440 260 440 235 V175 Q440 150 465 150Z" fill="#ffe27a"/></g>'
    s+='<circle cx="500" cy="205" r="12" fill="#ff8a3d"/><circle cx="545" cy="205" r="12" fill="#ff8a3d"/><circle cx="590" cy="205" r="12" fill="#ff8a3d"/></g>'
    # heart + question
    s+='<g filter="url(#sh2)"><circle cx="400" cy="300" r="40" fill="#fff"/><path d="M400 322 C372 304 370 282 386 280 C394 279 399 284 400 289 C401 284 406 279 414 280 C430 282 428 304 400 322Z" fill="#ff5c8a"/></g>'
    s+=sparkle(430,70,13)+sparkle(60,250,12)+sparkle(750,120,12)
    return s+'</svg>'
# ---------------- 5. 公開後のサポート ----------------
def support():
    s=HEAD+'<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1fae6b"/><stop offset="1" stop-color="#c3ec6c"/></linearGradient><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d8f7e3"/></linearGradient>'+SH+'</defs>'
    s+='<rect width="800" height="450" fill="url(#bg)"/><circle cx="700" cy="60" r="170" fill="#fff" opacity=".13"/><circle cx="70" cy="410" r="160" fill="#fff" opacity=".13"/>'
    # shield
    s+='<g filter="url(#sh)"><path d="M400 50 L535 98 V225 C535 305 475 365 400 398 C325 365 265 305 265 225 V98Z" fill="url(#sg)"/></g>'
    s+='<path d="M400 82 L506 120 V225 C506 288 460 337 400 365 C340 337 294 288 294 225 V120Z" fill="#2fc98e"/><path d="M350 225 L388 263 L458 185" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>'
    # gears
    s+='<g filter="url(#sh2)">'+gear(150,200,52,'#fff','#4fcf8d')+gear(235,300,34,'#ffe27a','#4fcf8d',7)+'</g>'
    # refresh arrows
    s+='<g filter="url(#sh2)" transform="translate(650 215)"><circle r="82" fill="#fff"/><path d="M-44 -6 A44 44 0 0 1 28 -34" fill="none" stroke="#1fae6b" stroke-width="13" stroke-linecap="round"/><path d="M16 -58 L44 -30 L8 -22Z" fill="#1fae6b"/><path d="M44 8 A44 44 0 0 1 -28 36" fill="none" stroke="#ffb347" stroke-width="13" stroke-linecap="round"/><path d="M-16 60 L-44 32 L-8 24Z" fill="#ffb347"/></g>'
    # wrench
    s+='<g transform="rotate(-35 640 360)" filter="url(#sh2)"><rect x="560" y="344" width="170" height="32" rx="16" fill="#fff"/><circle cx="560" cy="360" r="34" fill="#fff"/><rect x="520" y="347" width="44" height="26" rx="6" fill="#2fc98e"/></g>'
    # calendar
    s+='<g transform="rotate(-8 140 360)" filter="url(#sh2)"><rect x="70" y="320" width="130" height="100" rx="14" fill="#fff"/><path d="M70 334 Q70 320 84 320 L186 320 Q200 320 200 334 L200 345 L70 345Z" fill="#ff6b6b"/>'
    for r in range(2):
        for c in range(4): s+=f'<rect x="{82+c*28}" y="{356+r*28}" width="20" height="18" rx="5" fill="{"#2fc98e" if (r,c)==(1,2) else "#e6efe9"}"/>'
    s+='</g>'+sparkle(560,60,14)+sparkle(60,60,12)+sparkle(760,400,14)
    return s+'</svg>'
for n,f in [('price',price),('welfare',welfare),('design',design),('consult',consult),('support',support)]:
    open(os.path.join(OUT,n+'.svg'),'w',encoding='utf-8').write(f())
print('ok')
