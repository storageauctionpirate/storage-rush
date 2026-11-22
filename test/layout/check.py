import math,itertools,json,sys
from PIL import Image
R='/workspace/pirate-apps/new/storage-rush/assets/landmarks/'
LM=[('sign',2,'Yard Sign',250),('truck',3,'The Pickup',0),('office',5,'Office',500),('units',7,'Unit Row',800),('flea',9,'Flea Stall',1100),('thrift',11,'Thrift Shop',1400),('garage',13,'Garage',1800),('pawn',15,'Pirate Pawn',2200),('warehouse',17,'Warehouse',2600)]
SZ={n:[Image.open(R+n+'.png').size,Image.open(R+n+'-b.png').size] for n,*_ in LM}
sp=.27
def stop(i):return (.5+.17*math.sin(i*1.1+.3), -i*sp)   # y up negative (world, W=1)
def ov(a,b,pad=.008):return a[0]<b[2]+pad and b[0]<a[2]+pad and a[1]<b[3]+pad and b[1]<a[3]+pad
def stopbox(i):
    x,y=stop(i);w=.17 if i==19 else .135;h=w*.56
    return (x-w/2-.005,y-h*.62-.04,x+w/2+.03,y+h/2+(.05 if i==19 else .005))
def lmboxes(n,x,y,s,truck):
    s2=s*(1.05 if truck else 1);boxes=[]
    for (iw,ih) in SZ[n]:
        k=min(s2/iw,.85*s2/ih);dw,dh=iw*k,ih*k;bx=x-s2/2+(s2-dw)/2;by=y-.85*s2+(.85*s2-dh)/2
        boxes.append((bx,by,bx+dw,by+dh))
    sb=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
    return sb
def tagbox(x,y,s,names):
    fs=.032;tw=max(len(t)*fs*.62 for t in names)+.07;th=.058;ty=y+s*.1
    tw*=1.06;th*=1.06
    return (x-tw/2,ty-th/2,x+tw/2,ty+th/2)
def hustler(i):
    x,y=stop(i);hs=.2;cx=x-hs*.42;return (cx-hs*.33,y-hs*1.05,cx+hs*.33,y+hs*.03)
def button(i,Wpx):
    x,y=stop(i);bw,bh=150/Wpx,60/Wpx;bx=x+.08
    if bx+bw>1-8/Wpx:bx=x-.2-bw-4/Wpx
    bx=max(8/Wpx,min(1-bw-8/Wpx,bx));return (bx,y-bh/2,bx+bw,y+bh/2)
def elems(L,Wpx):
    E=[]
    for i in range(20):E.append(('stop%d'%(i+1),stopbox(i)))
    for i in range(20):E.append(('hustler@%d'%(i+1),hustler(i)));E.append(('nextbtn@%d'%(i+1),button(i,Wpx)))
    for (n,un,name,cost) in LM:
        x,y,s=L[n];names=[name,'BUILD $%s'%format(cost,',') if cost else name,'Unit %d'%un]
        E.append(('lm:'+n,lmboxes(n,x,y,s,n=='truck')));E.append(('tag:'+n,tagbox(x,y,s,names)))
    return E
def conflicts(L,Wpx=375):
    E=elems(L,Wpx);out=[]
    for a,b in itertools.combinations(E,2):
        an,bn=a[0],b[0]
        if not(an.startswith(('lm:','tag:')) or bn.startswith(('lm:','tag:'))):continue
        if an.split(':')[-1]==bn.split(':')[-1] and ':' in an and ':' in bn:continue
        if ov(a[1],b[1]):out.append((an,bn))
    return out
def old():
    L={}
    for (n,un,*_) in LM:
        x,y=stop(un-1);left=x>.5;L[n]=(.21 if left else .79,y-.01,.42)
    return L
if __name__=='__main__':
    for c in conflicts(old()):print(c)
