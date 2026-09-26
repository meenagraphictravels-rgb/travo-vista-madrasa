/* Travo Vista Madrasa - online foundation
   Preserves the original application UI and routes authentication through Supabase.
*/
(function(){
  'use strict';
  const REMEMBER_MS=8*60*60*1000;
  let client=null, orgId=localStorage.getItem('tv_org_id')||null, syncing=false, syncTimer=null;
  window.__tvSupabase=null; window.__tvOrgId=orgId;

  function msg(text){const el=document.getElementById('authMsg');if(el)el.textContent=text||'';}
  function validConfig(){return window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !String(window.SUPABASE_URL).includes('PASTE_NEW_') && !String(window.SUPABASE_ANON_KEY).includes('PASTE_NEW_');}
  function authUser(){return client?.auth?.getUser ? null : null}
  async function ensureOrg(user){
    if(!client||!user)throw new Error('Authentication session is missing.');
    const {data,error}=await client.from('organizations').select('id,name').eq('owner_id',user.id).limit(1).maybeSingle();
    if(error)throw error;
    if(data){orgId=data.id;localStorage.setItem('tv_org_id',orgId);window.__tvOrgId=orgId;return data;}
    const name=String(user.user_metadata?.name||user.email||'Madrasa').trim()+' Organization';
    const ins=await client.from('organizations').insert({owner_id:user.id,name}).select('id,name').single();
    if(ins.error)throw ins.error;
    orgId=ins.data.id;localStorage.setItem('tv_org_id',orgId);window.__tvOrgId=orgId;return ins.data;
  }
  function snapshot(){
    const out={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i); if(k&&k.startsWith('tv_')){try{out[k]=JSON.parse(localStorage.getItem(k))}catch{out[k]=localStorage.getItem(k)}}
    }
    delete out.tv_current_user; delete out.tv_auth;
    return out;
  }
  async function pushCloud(){
    if(syncing||!client||!orgId)return;
    syncing=true;
    try{
      const payload={org_id:orgId,data:snapshot(),updated_at:new Date().toISOString()};
      const {error}=await client.from('app_data').upsert(payload,{onConflict:'org_id'});
      if(error)console.warn('Cloud sync:',error.message);
    }finally{syncing=false}
  }
  function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(pushCloud,900)}
  const originalSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(k&&k.startsWith('tv_')&&!k.includes('current_user')&&!k.includes('auth'))scheduleSync()};

  async function pullCloud(){
    if(!client||!orgId)return;
    const {data,error}=await client.from('app_data').select('data').eq('org_id',orgId).maybeSingle();
    if(error)throw error;
    if(data?.data&&typeof data.data==='object')Object.entries(data.data).forEach(([k,v])=>{try{originalSet.call(localStorage,k,typeof v==='string'?v:JSON.stringify(v))}catch{}});
  }
  function finish(user,remember){
    const u={name:user.name||user.email||user.identifier||'',identifier:user.email||user.identifier||'',role:user.role||'Administrator',type:user.type||'admin'};
    localStorage.setItem('tv_current_user',JSON.stringify(u));
    sessionStorage.setItem('tvgsLoggedIn','1');
    if(remember){localStorage.setItem('tvgsRemember','1');localStorage.setItem('tvgsRememberId',u.identifier);localStorage.setItem('tvgsRememberUntil',String(Date.now()+REMEMBER_MS))}
    else{localStorage.removeItem('tvgsRemember');localStorage.removeItem('tvgsRememberId');localStorage.removeItem('tvgsRememberUntil')}
    document.getElementById('authOverlay')?.classList.add('hidden');
    render();
  }
  window.authOverlay=function(mode='login'){
    const box=document.getElementById('authOverlay');if(!box)return;box.classList.remove('hidden');
    const signup=mode==='signup';
    box.innerHTML=`<div class="authBox"><div class="authBrand"><img src="icon.ico"><h2>${signup?'Create Administrator Account':'Welcome Back'}</h2><p>Travo Vista Group – Madrasa Management System</p></div><div class="authTabs"><button class="active">${signup?'Create Account':'Login'}</button>${signup?'':'<button type="button" onclick="authOverlay(\'signup\')" style="margin-left:8px">Create Account</button>'}</div><form id="onlineAuthForm"><div class="field">${signup?'<label>Admin Name</label><input name="name" required autofocus>':'<label>Email Address</label><input name="identifier" type="email" required autocomplete="username" autofocus>'}</div>${signup?'<div class="field" style="margin-top:12px"><label>Email Address</label><input name="identifier" type="email" required autocomplete="username"></div>':''}<div class="field" style="margin-top:12px"><label>Password</label><input name="password" type="password" minlength="6" required autocomplete="${signup?'new':'current'}-password"></div>${signup?'<div class="field" style="margin-top:12px"><label>Confirm Password</label><input name="confirm" type="password" minlength="6" required autocomplete="new-password"></div>':'<label class="authRemember"><input type="checkbox" name="remember"> Remember Me</label>'}<div id="authMsg" class="authError"></div><div class="actions"><button type="submit" class="primary" style="width:100%">${signup?'Create Administrator Account':'Login'}</button></div></form><div class="authLinks">${signup?'<button type="button" onclick="authOverlay(\'login\')">Already have an account? Login</button>':'<button type="button" onclick="forgotPassword()">Forgot Password?</button>'}</div><div class="authHint">Administrator and staff accounts are secured online for this organization.</div></div>`;
    document.getElementById('onlineAuthForm').onsubmit=signup?window.doSignup:window.doLogin;
  };
  window.doSignup=async function(e){e.preventDefault();msg('Creating account...');try{if(!client)throw new Error('Supabase is not configured.');const f=new FormData(e.target),name=String(f.get('name')||'').trim(),email=String(f.get('identifier')||'').trim().toLowerCase(),password=String(f.get('password')||''),confirm=String(f.get('confirm')||'');if(!name||!email)throw new Error('Please complete all required fields.');if(password.length<6)throw new Error('Password must be at least 6 characters.');if(password!==confirm)throw new Error('Passwords do not match.');const {data,error}=await client.auth.signUp({email,password,options:{data:{name},emailRedirectTo:location.origin+location.pathname}});if(error)throw error;if(!data.user)throw new Error('Account could not be created.');if(data.session){await ensureOrg(data.user);await pullCloud();finish({name,email,role:'Administrator',type:'admin'},true)}else{msg('Account created. Please confirm your email, then return here and login.')}}catch(err){console.error(err);msg(err?.message||'Unable to create account.')}};
  window.doLogin=async function(e){e.preventDefault();msg('Signing in...');try{if(!client)throw new Error('Supabase is not configured.');const f=new FormData(e.target),email=String(f.get('identifier')||'').trim().toLowerCase(),password=String(f.get('password')||''),remember=f.get('remember')==='on';const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;await ensureOrg(data.user);await pullCloud();finish({name:data.user.user_metadata?.name||email,email,role:'Administrator',type:'admin'},remember)}catch(err){console.error(err);msg(err?.message||'Invalid login or password.')}};
  window.forgotPassword=async function(){const email=prompt('Enter your registered email address:');if(!email||!client)return;try{const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:location.href});if(error)throw error;alert('Password reset email sent.')}catch(e){alert('Password reset failed: '+(e?.message||'Unknown error'))}};
  window.logout=async function(){try{if(client)await client.auth.signOut()}catch{}sessionStorage.removeItem('tvgsLoggedIn');localStorage.removeItem('tv_current_user');localStorage.removeItem('tv_org_id');orgId=null;window.__tvOrgId=null;authOverlay('login')};
  window.initAuth=async function(){
    if(!validConfig()){authOverlay('login');msg('New Supabase project is not configured yet. Add the URL and publishable key in supabase-config.js.');return}
    try{
      client=supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});window.__tvSupabase=client;
      const {data}=await client.auth.getSession();
      if(data?.session?.user){await ensureOrg(data.session.user);await pullCloud();finish({name:data.session.user.user_metadata?.name||data.session.user.email,email:data.session.user.email,role:'Administrator',type:'admin'},true)}else authOverlay('login');
      client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){sessionStorage.removeItem('tvgsLoggedIn');authOverlay('login')}});
    }catch(e){console.error(e);authOverlay('login');msg('Online startup failed: '+(e?.message||'Unknown error'))}
  };
  window.tvCloudReady=()=>!!(client&&orgId);
  window.tvCloudSync=pushCloud;
  window.addEventListener('load',()=>window.initAuth());
})();
