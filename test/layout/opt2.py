import sys;sys.path.insert(0,'/tmp/sr/lay')
from check import *
def hustlerSide(i,side):
    x,y=stop(i);hs=.2;cx=x-hs*.42 if side<0 else x+hs*.42;return (cx-hs*.33,y-hs*1.05,cx+hs*.33,y+hs*.03)
def btnCands(i,Wpx,hb):
    x,y=stop(i);bw,bh=150/Wpx,60/Wpx;out=[]
    for bx,by in [(max(hb[2],x+.075)+.01,y-bh/2),(min(hb[0],x-.075)-.01-bw,y-bh/2),(x-bw/2,y+.06),(x-bw/2,y-.09-bh)]:
        bx=max(8/Wpx,min(1-bw-8/Wpx,bx));out.append((bx,by,bx+bw,by+bh))
    return out
def lmRects(L):
    R=[]
    for (n,un,name,cost) in LM:
        x,y,s=L[n];names=[name,'BUILD $%s'%format(cost,',') if cost else name,'Unit %d'%un]
        R.append((n,lmboxes(n,x,y,s,n=='truck')));R.append((n,tagbox(x,y,s,names)))
    return R
def place(i,R,Wpx):
    best=None
    for side in (-1,1):
        hb=hustlerSide(i,side)
        if hb[0]<0 or hb[2]>1:continue
        hbad=sum(ov(hb,r) for _,r in R)
        for k,bb in enumerate(btnCands(i,Wpx,hb)):
            bad=hbad*10+sum(ov(bb,r) for _,r in R)*3+ov(bb,hb)*5+sum(ov(bb,stopbox(j)) for j in range(20) if j!=i)*0+(0 if side<0 else .1)+k*.05
            if best is None or bad<best[0]:best=(bad,side,k,hb,bb)
    return best
def score(L,Wpx,near=None):
    R=lmRects(L);bad=0;det=[]
    for a,b in itertools.combinations(R,2):
        if a[0]!=b[0] and ov(a[1],b[1]):bad+=10;det.append(('lm',a[0],b[0]))
    for n,r in R:
        for j in range(20):
            if ov(r,stopbox(j)):bad+=10;det.append(('stop',n,j+1))
        if r[0]<-.01 or r[2]>1.01:bad+=10;det.append(('edge',n))
    for i in range(20):
        if near is not None and abs(i-near)>3:continue
        p=place(i,R,Wpx)
        if p[0]>=1:bad+=p[0];det.append(('slot',i+1,round(p[0],2)))
    return bad,det
if __name__=='__main__':
    L={}
    for (n,un,*_) in LM:x,y=stop(un-1);L[n]=(.21 if x>.5 else .79,y-.01,.42)
    for it in range(2):
     for (n,un,*_) in LM:
        x0,y0=stop(un-1);best=None
        for s in (.42,.38,.34,.30):
          for x in [v/100 for v in range(15,86,3)]:
            if x-s/2<-.01 or x+s/2>1.01:continue
            for dy in [d/100 for d in range(-20,21,4)]:
                L2=dict(L);L2[n]=(x,y0+dy,s)
                sc=score(L2,357,near=un-1)[0]
                key=(sc,-s,abs(dy),abs(x-L[n][0]))
                if best is None or key<best[0]:best=(key,(x,y0+dy,s))
        L[n]=best[1];print(it,n,best,flush=True)
    for W in (390,375,357):print(W,score(L,W))
    json.dump({n:[round(L[n][0],3),round(L[n][1]-stop(un-1)[1],3),L[n][2]] for (n,un,*_) in LM},open('/tmp/sr/lay/best2.json','w'))
