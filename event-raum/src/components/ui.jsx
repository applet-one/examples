import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...values) => twMerge(clsx(values));
export function Button({variant='primary',size='default',className='',...props}) { return <button className={cn('btn',`btn-${variant}`,`btn-${size}`,className)} {...props}/>; }
export function Badge({children,variant='neutral',className=''}) { return <span className={cn('badge',`badge-${variant}`,className)}>{children}</span>; }
export function Card({children,className=''}) { return <div className={cn('card',className)}>{children}</div>; }
export function Field({label,hint,children,required=false}) { return <label className="field"><span className="field-label">{label}{required && <span className="required"> *</span>}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>; }
export function Input(props) { return <input className="input" {...props}/>; }
export function Dialog({open,onClose,title,children}) { if(!open) return null; return <div className="dialog-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) onClose(); }} role="presentation"><div className="dialog" role="dialog" aria-modal="true" aria-label={title}><div className="dialog-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Schließen">×</button></div>{children}</div></div>; }
