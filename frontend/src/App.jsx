import React, { useState, useEffect } from 'react'
import translations from './i18n'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function Header({lang, setLang, isAdmin, onLogout}){
  return (<header className='site-header'>
    <div className='container'>
      <h1>{translations[lang].title}</h1>
      <nav>
        <a href='#menu'>{translations[lang].menu}</a>
        <a href='#reserve'>{translations[lang].reserve}</a>
        <button onClick={()=>setLang(lang==='en'?'fr':'en')} className='lang-btn'>{lang==='en'?'FR':'EN'}</button>
        {isAdmin? <button onClick={onLogout} className='btn small'>{translations[lang].logout}</button> : <a href='#admin' className='btn small'>{translations[lang].admin}</a>}
      </nav>
    </div>
  </header>)
}

function Menu({lang}){
  const [items, setItems] = useState([])
  useEffect(()=>{
    axios.get(API + '/menu').then(r=>setItems(r.data.menu)).catch(()=>{})
  },[])
  return (<section id='menu' className='container menu'>
    <h2>{translations[lang].menu}</h2>
    <div className='grid'>{items.map(it=> (
      <div key={it.id} className='card'>
        <div>
          <h3>{it.name}</h3>
          <p>{it.description}</p>
        </div>
        <div className='price'>{it.price} MAD</div>
      </div>
    ))}</div>
  </section>)
}

function Reservation({lang}){
  const [form, setForm] = useState({name:'',email:'',phone:'',people:2,date:'',time:'',notes:''})
  const [msg, setMsg] = useState(null)
  const submit = async (e)=>{
    e.preventDefault()
    try{
      const r = await axios.post(API + '/reservations', form)
      if(r.data.success){ setMsg({ok:true, txt: 'Réservation reçue — ref: '+r.data.id}); setForm({name:'',email:'',phone:'',people:2,date:'',time:'',notes:''}) }
      else setMsg({ok:false, txt: r.data.error || 'Error'})
    }catch(err){ setMsg({ok:false, txt: err.response?.data?.detail || err.message}) }
  }
  return (<section id='reserve' className='container reserve'>
    <h2>{translations[lang].reserve}</h2>
    <form onSubmit={submit} className='form'>
      <label>{translations[lang].name}<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label>
      <label>{translations[lang].email}<input type='email' value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label>
      <label>{translations[lang].phone}<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label>
      <label>{translations[lang].people}<input type='number' min='1' value={form.people} onChange={e=>setForm({...form,people:e.target.value})} /></label>
      <label>{translations[lang].date}<input type='date' value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label>
      <label>{translations[lang].time}<input type='time' value={form.time} onChange={e=>setForm({...form,time:e.target.value})} required/></label>
      <label>{translations[lang].notes}<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}></textarea></label>
      <button className='btn' type='submit'>{translations[lang].send}</button>
      {msg && <p className={msg.ok? 'success':'error'}>{msg.txt}</p>}
    </form>
  </section>)
}

function Admin({lang, token, setToken}){
  const [login, setLogin] = useState({user:'admin', password:''})
  const [reservations, setReservations] = useState([])
  const [err, setErr] = useState(null)

  useEffect(()=>{
    if(token){
      axios.get(API + '/reservations', { headers: { Authorization: 'Bearer '+token } })
        .then(r=>setReservations(r.data.reservations))
        .catch(e=>{ setErr('Unauthorized or server error') })
    }
  },[token])

  const doLogin = async (e)=>{
    e.preventDefault()
    try{
      const r = await axios.post(API + '/admin/login', login)
      setToken(r.data.token)
      localStorage.setItem('LAM_TOKEN', r.data.token)
    }catch(err){ setErr(err.response?.data?.detail || err.message) }
  }

  const remove = async (id)=>{
    if(!confirm('Delete reservation #'+id+' ?')) return;
    try{
      await axios.delete(API + '/reservations/'+id, { headers:{ Authorization: 'Bearer '+token } })
      setReservations(reservations.filter(r=>r.id!==id))
    }catch(e){ setErr('Delete failed') }
  }

  if(!token){
    return (<section id='admin' className='container admin'>
      <h2>{translations[lang].admin}</h2>
      <form onSubmit={doLogin} className='form small'>
        <label>Username<input value={login.user} onChange={e=>setLogin({...login,user:e.target.value})} /></label>
        <label>Password<input type='password' value={login.password} onChange={e=>setLogin({...login,password:e.target.value})} /></label>
        <button className='btn' type='submit'>{translations[lang].login}</button>
        {err && <p className='error'>{err}</p>}
      </form>
    </section>)
  }

  return (<section id='admin' className='container admin'>
    <h2>{translations[lang].admin}</h2>
    {err && <p className='error'>{err}</p>}
    <table className='table'>
      <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Date</th><th>Time</th><th>People</th><th>Notes</th><th>Actions</th></tr></thead>
      <tbody>{reservations.map(r=>(<tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.phone}</td><td>{r.date}</td><td>{r.time}</td><td>{r.people}</td><td>{r.notes}</td><td><button onClick={()=>remove(r.id)} className='btn small'>Delete</button></td></tr>))}</tbody>
    </table>
  </section>)
}

export default function App(){
  const [lang, setLang] = useState('fr')
  const [token, setToken] = useState(localStorage.getItem('LAM_TOKEN') || null)
  const logout = ()=>{ setToken(null); localStorage.removeItem('LAM_TOKEN') }
  return (<div>
    <Header lang={lang} setLang={setLang} isAdmin={!!token} onLogout={logout} />
    <main>
      <section className='hero container'><h2>{translations[lang].hero}</h2><p></p></section>
      <Menu lang={lang} />
      <Reservation lang={lang} />
      <Admin lang={lang} token={token} setToken={setToken} />
    </main>
    <footer className='site-footer'><div className='container'>© {new Date().getFullYear()} L'amandier — Address: 12 Rue Example, Tanger</div></footer>
  </div>)
}
