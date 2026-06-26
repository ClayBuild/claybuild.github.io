// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
// Contact form handler
document.querySelectorAll('form').forEach(function(f){
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var ff=f.querySelector('.ff');var fs=f.querySelector('.fs');
    if(ff&&fs){ff.style.display='none';fs.style.display='block';}
  });
});
