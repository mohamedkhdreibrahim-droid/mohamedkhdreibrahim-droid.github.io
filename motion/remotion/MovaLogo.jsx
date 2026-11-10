import React from 'react';
import {AbsoluteFill, Composition, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const Reveal = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const intro = spring({frame, fps, config:{damping:18, stiffness:95}});
  const scale = interpolate(intro,[0,1],[0.7,1]);
  const opacity = interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'});
  const glow = interpolate(frame,[0,70,140],[0.25,0.48,0.25],{extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background:'radial-gradient(circle at 50% 44%, #2a1551, #0c0918 65%)',alignItems:'center',justifyContent:'center',fontFamily:'Arial,sans-serif'}}>
    <div style={{position:'absolute',width:650,height:650,borderRadius:'50%',background:'#7e4bed',filter:'blur(130px)',opacity:glow}}/>
    <div style={{opacity,transform:`scale(${scale})`,textAlign:'center',position:'relative'}}>
      <svg width="410" height="190" viewBox="0 0 410 190"><defs><linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9c3ff"/><stop offset="1" stopColor="#6939d2"/></linearGradient></defs>
      <path d="M95 105 L138 26 Q146 12 160 28 L189 72 L228 26 Q239 14 252 28 L273 55 L253 83 L238 60 L199 104 Q188 118 175 100 L151 63 L128 105Z" fill="url(#v)"/>
      <path d="M270 36 L311 66 Q320 73 311 80 L270 110 Q261 116 261 105 L261 41 Q261 31 270 36Z" fill="#ffb23d"/>
      </svg>
      <div style={{fontSize:112,fontWeight:900,letterSpacing:8,color:'#fff',lineHeight:1}}>MOVA</div>
      <div style={{fontSize:26,letterSpacing:16,color:'#d6c1f5',marginTop:14}}>CREATIVE</div>
    </div>
  </AbsoluteFill>;
};
export const RemotionRoot=()=> <Composition id="MovaLogo" component={Reveal} durationInFrames={150} fps={30} width={1920} height={1080}/>;
