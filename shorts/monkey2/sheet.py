import sys,glob,os
from PIL import Image,ImageDraw
d,out=sys.argv[1],sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 8; w=int(sys.argv[4]) if len(sys.argv)>4 else 216; h=w*16//9
fs=sorted(glob.glob(d+'/f*.jpg'))
rows=(len(fs)+cols-1)//cols; S=Image.new('RGB',(cols*w,rows*(h+18)),'white'); D=ImageDraw.Draw(S)
for i,f in enumerate(fs):
    im=Image.open(f).resize((w,h)); x,y=(i%cols)*w,(i//cols)*(h+18); S.paste(im,(x,y+18)); D.text((x+4,y+3),os.path.basename(f)[1:5],fill='black')
S.save(out,quality=88)
