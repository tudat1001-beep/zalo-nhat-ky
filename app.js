'use strict';
const base = 'https://wzbcjvopexlzowclkier.supabase.co';
const key = 'sb_publishable_gbZa0GOSvbRaMoNCizUlZA_iuBn0uQT';
const $ = id => document.getElementById(id);
let token = '', reports = [], selected = null;
async function request(path, options = {}) {
  const response = await fetch(base + path, {...options, headers: {apikey:key, 'Content-Type':'application/json', ...(token ? {Authorization:'Bearer '+token} : {}), ...options.headers}});
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Không thể kết nối. Vui lòng thử lại.');
  return data;
}
function message(text) { $('status').textContent = text; }
function showReport(id) {
  selected = reports.find(report => report.id === id);
  if (!selected) return;
  document.querySelectorAll('.report-button').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.id) === id)));
  $('empty').hidden = true; $('detail').hidden = false;
  $('detail-title').textContent = new Date(selected.created_at).toLocaleString('vi-VN', {timeZone:'Asia/Ho_Chi_Minh', dateStyle:'full', timeStyle:'short'});
  $('notes').value = selected.notes || ''; $('notes-status').textContent = '';
  $('preview').srcdoc = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'">' + selected.html;
}
async function loadReports() {
  message(''); $('reports').replaceChildren();
  reports = await request('/rest/v1/zalo_summaries?select=id,created_at,html,notes&order=created_at.desc&limit=100');
  $('count').textContent = String(reports.length);
  if (!reports.length) { const p = document.createElement('p'); p.className='muted'; p.textContent='Chưa có bản tổng hợp nào.'; $('reports').append(p); $('empty').hidden=false; $('detail').hidden=true; return; }
  for (const report of reports) {
    const button = document.createElement('button'); button.className='report-button'; button.dataset.id=report.id; button.type='button';
    const title = document.createElement('strong'); title.textContent = new Date(report.created_at).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
    const time = document.createElement('small'); time.textContent = 'Tạo lúc ' + new Date(report.created_at).toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'});
    button.append(title,time); button.addEventListener('click',()=>showReport(report.id)); $('reports').append(button);
  }
  showReport(reports.some(r => r.id === selected?.id) ? selected.id : reports[0].id);
}
$('login-form').addEventListener('submit', async event => {
  event.preventDefault(); message(''); const button=event.currentTarget.querySelector('button'); button.disabled=true;
  try { const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})}); token=result.access_token; $('password').value=''; $('login-panel').hidden=true; $('dashboard').hidden=false; $('logout').hidden=false; await loadReports(); }
  catch(error) { message('Không thể đăng nhập hoặc tải dữ liệu: '+error.message); } finally {button.disabled=false;}
});
$('refresh').addEventListener('click',()=>loadReports().catch(error=>message(error.message)));
$('logout').addEventListener('click',()=>{token=''; reports=[]; selected=null; $('preview').srcdoc=''; $('dashboard').hidden=true; $('logout').hidden=true; $('login-panel').hidden=false; $('detail').hidden=true; $('empty').hidden=false; message('');});
$('notes-form').addEventListener('submit',async event=>{event.preventDefault(); if(!selected)return; const button=event.currentTarget.querySelector('button'); button.disabled=true; $('notes-status').textContent='Đang lưu…'; try { const updated=await request('/rest/v1/zalo_summaries?id=eq.'+encodeURIComponent(selected.id),{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({notes:$('notes').value})}); if(updated.length!==1) throw new Error('Không có quyền sửa bản tổng hợp này.'); selected.notes=$('notes').value; $('notes-status').textContent='Đã lưu ghi chú.'; } catch(error){$('notes-status').textContent='Không lưu được: '+error.message;} finally{button.disabled=false;}});
$('download').addEventListener('click',()=>{if(!selected)return; const url=URL.createObjectURL(new Blob([selected.html],{type:'text/html;charset=utf-8'})); const link=document.createElement('a'); link.href=url; link.download='tong-hop-zalo-'+selected.id+'.html'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);});
