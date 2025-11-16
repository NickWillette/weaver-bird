import{j as a}from"./jsx-runtime-u17CrQMm.js";const j="_card_1jz1k_1",A="_dragging_1jz1k_27",h="_iconFrame_1jz1k_33",f="_icon_1jz1k_33",v="_body_1jz1k_54",y="_nameRow_1jz1k_61",k="_name_1jz1k_61",z="_badges_1jz1k_76",x="_badge_1jz1k_76",N="_description_1jz1k_92",S="_metadata_1jz1k_103",w="_metaItem_1jz1k_110",B="_accentEmerald_1jz1k_127",M="_accentGold_1jz1k_134",R="_accentBerry_1jz1k_141",e={card:j,dragging:A,iconFrame:h,icon:f,body:v,nameRow:y,name:k,badges:z,badge:x,description:N,metadata:S,metaItem:w,accentEmerald:B,accentGold:M,accentBerry:R},C={emerald:e.accentEmerald,gold:e.accentGold,berry:e.accentBerry};function g({name:u,description:n,iconSrc:l,metadata:d=[],badges:i=[],accent:p="emerald",isDragging:m=!1}){const _=C[p],b=[e.card,_,m?e.dragging:""].filter(Boolean).join(" ");return a.jsxs("div",{className:b,"data-dragging":m||void 0,children:[l&&a.jsx("div",{className:e.iconFrame,children:a.jsx("img",{src:l,alt:"",className:e.icon})}),a.jsxs("div",{className:e.body,children:[a.jsxs("div",{className:e.nameRow,children:[a.jsx("p",{className:e.name,children:u}),i?.length>0&&a.jsx("div",{className:e.badges,children:i.map(r=>a.jsx("span",{className:e.badge,children:r},r))})]}),n&&a.jsx("div",{className:e.description,children:typeof n=="string"?a.jsx("span",{children:n}):n}),d.length>0&&a.jsx("dl",{className:e.metadata,children:d.map(r=>a.jsxs("div",{className:e.metaItem,children:[a.jsx("dt",{children:r.label}),a.jsx("dd",{children:r.value})]},`${r.label}-${r.value}`))})]})]})}g.__docgenInfo={description:"",methods:[],displayName:"ResourcePackCard",props:{name:{required:!0,tsType:{name:"string"},description:""},description:{required:!1,tsType:{name:"ReactNode"},description:""},iconSrc:{required:!1,tsType:{name:"string"},description:""},metadata:{required:!1,tsType:{name:"Array",elements:[{name:"ResourcePackCardMetadata"}],raw:"ResourcePackCardMetadata[]"},description:"",defaultValue:{value:"[]",computed:!1}},badges:{required:!1,tsType:{name:"Array",elements:[{name:"string"}],raw:"string[]"},description:"",defaultValue:{value:"[]",computed:!1}},accent:{required:!1,tsType:{name:"union",raw:'"emerald" | "gold" | "berry"',elements:[{name:"literal",value:'"emerald"'},{name:"literal",value:'"gold"'},{name:"literal",value:'"berry"'}]},description:"",defaultValue:{value:'"emerald"',computed:!1}},isDragging:{required:!1,tsType:{name:"boolean"},description:"",defaultValue:{value:"false",computed:!1}}}};const V={component:g,title:"Cards/ResourcePackCard",tags:["autodocs"],args:{name:"Lapis Dreams",description:"A vibrant pack that drenches your overworld in lapis blues and warm gold trim.",iconSrc:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAAB8c7QfAAAAI0lEQVRIie3MMQEAAAwCoNm/9C1hBZQM5xjWQYMGDRo0aNBg/QAstgQwLHXACc8AAAAASUVORK5CYII=",metadata:[{label:"Size",value:"42 MB"},{label:"Version",value:"1.21"}],badges:["64x","Stylized"]}},s={},t={args:{name:"Nether Noir",accent:"berry",description:"Wraps your world in brutalist obsidian palettes with ember gradients and chunky UI chrome. Perfect for late-night base builds.",metadata:[{label:"Size",value:"108 MB"},{label:"Version",value:"1.20"}]}},c={args:{name:"Emerald Bloom",accent:"emerald",isDragging:!0,metadata:[{label:"Size",value:"12 MB"}]}},o={args:{name:"Vanilla Tweaks",accent:"gold",badges:["16x","Minimal"],metadata:[{label:"Size",value:"4 MB"}],iconSrc:void 0}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    name: "Nether Noir",
    accent: "berry",
    description: "Wraps your world in brutalist obsidian palettes with ember gradients and chunky UI chrome. Perfect for late-night base builds.",
    metadata: [{
      label: "Size",
      value: "108 MB"
    }, {
      label: "Version",
      value: "1.20"
    }]
  }
}`,...t.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    name: "Emerald Bloom",
    accent: "emerald",
    isDragging: true,
    metadata: [{
      label: "Size",
      value: "12 MB"
    }]
  }
}`,...c.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    name: "Vanilla Tweaks",
    accent: "gold",
    badges: ["16x", "Minimal"],
    metadata: [{
      label: "Size",
      value: "4 MB"
    }],
    iconSrc: undefined
  }
}`,...o.parameters?.docs?.source}}};const E=["Default","WithLongDescription","DraggingState","NoIcon"];export{s as Default,c as DraggingState,o as NoIcon,t as WithLongDescription,E as __namedExportsOrder,V as default};
