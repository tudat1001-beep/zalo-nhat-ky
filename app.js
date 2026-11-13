'use strict';
const base = 'https://wzbcjvopexlzowclkier.supabase.co';
const key = 'sb_publishable_gbZa0GOSvbRaMoNCizUlZA_iuBn0uQT';
const $ = id => document.getElementById(id);
let token = '', reports = [], selected = null;
const reportStyle = `<style>
  *{box-sizing:border-box}body{font:15px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif!important;max-width:none!important;margin:0!important;padding:28px!important;color:#193047!important;background:#fff}
  h1{font-size:23px;letter-spacing:-.04em;margin:0 0 3px;color:#102d46}h1+p{font-size:12px;color:#718497;margin:0 0 24px}
  h2{font-size:12px!important;letter-spacing:.1em;text-transform:uppercase;color:#42657b;margin:26px 0 12px!important}
  h2:first-of-type+p{background:#edf8f5;border-left:3px solid #17a294;border-radius:0 12px 12px 0;padding:16px 18px;margin:0;color:#234e51;line-height:1.6}
  .table-wrap{overflow:auto;container-type:inline-size;max-height:420px;border:1px solid #e3edf1;border-radius:12px}
  table{width:100%;border:0!important;border-collapse:separate!important;border-spacing:0;table-layout:fixed}thead{position:sticky;top:0;z-index:1}th{background:#eef5f7!important;color:#5a7182;font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:13px 15px!important;border:0!important;text-align:left}
  td{border:0!important;border-top:1px solid #edf2f5!important;padding:15px!important;vertical-align:top;overflow-wrap:anywhere;color:#415769}td:first-child{font-weight:700;color:#16374e}tbody tr:nth-child(even) td{background:#fbfdfd}
  ul{list-style:none;padding:0;margin:0}li{position:relative;margin:0!important;padding:11px 12px 11px 27px;border-bottom:1px solid #edf2f5;color:#40576a}li:before{content:'•';position:absolute;left:8px;color:#13a193;font-weight:900}
  @container (width < 570px){table,thead,tbody,tr,th,td{display:block}thead{display:none}tbody tr{border-bottom:1px solid #dce8ee;padding:5px 0}td{display:flex;gap:10px;align-items:baseline;padding:8px 14px!important;border:0!important}td:before{font-size:11px;font-weight:700;text-transform:uppercase;color:#788c9a;min-width:115px}td:nth-child(1):before{content:'Công việc'}td:nth-child(2):before{content:'Người phụ trách'}td:nth-child(3):before{content:'Hạn'}td:nth-child(4):before{content:'Nguồn'}}
  @media(max-width:600px){.table-wrap{max-height:none}}
  @media(max-width:500px){body{padding:20px 16px!important}h1{font-size:20px}}
</style>`;
function renderReport(html) {
  const framed = html.replace('<table>', '<div class="table-wrap" role="region" aria-label="Danh sách nhiệm vụ" tabindex="0"><table>').replace('</table>', '</table></div>');
  return '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'">' + framed + reportStyle;
}
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
  $('preview').srcdoc = renderReport(selected.html);
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
$('download').addEventListener('click',()=>{if(!selected)return; const url=URL.createObjectURL(new Blob([renderReport(selected.html)],{type:'text/html;charset=utf-8'})); const link=document.createElement('a'); link.href=url; link.download='tong-hop-zalo-'+selected.id+'.html'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);});
