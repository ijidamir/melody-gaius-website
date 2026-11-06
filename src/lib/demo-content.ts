import type { SiteData } from './types';

// A safe visual preview until the owner connects Supabase and runs the migration.
// The same content is seeded in supabase/migrations/*.sql.
export const previewContent: SiteData = {
  settings: {
    id: 1, name: 'Melody Gaius Danjuma',
    tagline: 'Social worker · Christian counselor · Humanitarian',
    intro: 'A passionate social worker, Christian counselor and humanitarian based in Taraba State, Nigeria.',
    mission: 'Reveal Jesus by feeding the people.',
    about: 'Melody is the founder and Managing Director of the Melody Gaius Foundation, a faith-based charity dedicated to feeding the hungry, hosting children’s outreach programs and providing local community support. Her work blends physical charity with spiritual ministry and psychological support.',
    recognition: 'Recognized by the Rhapsodi Affos Blog as one of Taraba’s Twenty Most Influential Youths for her community and philanthropic outreach.',
    counseling: 'Through Aviv Counseling, Melody focuses on family support and mental well-being.',
    contact_email: '', seo_title: 'Melody Gaius Danjuma — Humanitarian & Counselor',
    seo_description: 'Faith, food and healing: outreach, counseling and community support in Taraba, Gombe and Adamawa, Nigeria.',
    seo_image_id: null, default_theme: 'dark', footer_location: 'Taraba State, Nigeria',
  },
  sections: [
    {id:'section-story',slug:'story',eyebrow:'Her story',heading:'Faith, food & healing.',description:''},
    {id:'section-story-about',slug:'story_about',eyebrow:'',heading:'About',description:''},
    {id:'section-story-recognition',slug:'story_recognition',eyebrow:'',heading:'Recognition',description:''},
    {id:'section-story-counseling',slug:'story_counseling',eyebrow:'',heading:'Counseling',description:''},
    {id:'section-impact',slug:'impact',eyebrow:'',heading:'Regional impact',description:'From her home in Takum to communities across northern Nigeria.'},
    {id:'section-care',slug:'care',eyebrow:'Holistic care',heading:'Beyond the plate.',description:''},
    {id:'section-videos',slug:'videos',eyebrow:'Stories in motion',heading:'Impact in motion',description:'Moments of service, compassion and hope from our community outreaches.'},
    {id:'section-partners',slug:'partners',eyebrow:'In partnership with',heading:'',description:''},
    {id:'section-connect',slug:'connect',eyebrow:'',heading:'Every meal is a message of hope.',description:'Partner with the Melody Gaius Foundation to reach more children and families.'},
  ],
  media: [
    {id:'00000000-0000-4000-8000-000000000001',url:'/images/hero.jpg',storage_path:null,filename:'hero.jpg',alt_text:'Melody Gaius Danjuma',media_type:'image',file_size:0,created_at:''},
    {id:'00000000-0000-4000-8000-000000000002',url:'/images/feeding.jpg',storage_path:null,filename:'feeding.jpg',alt_text:'Outreach and food distribution',media_type:'image',file_size:0,created_at:''},
    {id:'00000000-0000-4000-8000-000000000003',url:'/images/widows.jpg',storage_path:null,filename:'widows.jpg',alt_text:'Women receiving care and support',media_type:'image',file_size:0,created_at:''},
    {id:'00000000-0000-4000-8000-000000000004',url:'/images/counsel.jpg',storage_path:null,filename:'counsel.jpg',alt_text:'Counselling and support',media_type:'image',file_size:0,created_at:''},
  ],
  section_media: [
    {id:'hero-section-media',section_key:'hero',media_id:'00000000-0000-4000-8000-000000000001',sort_order:0},
    {id:'story-section-media',section_key:'story',media_id:'00000000-0000-4000-8000-000000000004',sort_order:0},
    {id:'connect-section-media',section_key:'connect',media_id:'00000000-0000-4000-8000-000000000002',sort_order:0},
  ],
  outreaches: [
    {id:'outreach-taraba',location:'Taraba State',title:'Where it began — Takum',date_label:'Ongoing',description:'As a native of Takum, Melody launched her earliest efforts here, providing direct meals and spiritual support to less-privileged individuals.',stat:'Hundreds fed',media_id:'00000000-0000-4000-8000-000000000002',sort_order:1,published:true},
    {id:'outreach-gombe',location:'Gombe State',title:'Feed a Thousand Children',date_label:'May 2026',description:'With the Purpose Ignite Initiative, the foundation distributed raw food items and cooked meals across Gombe city.',stat:'1,000+ children & families',media_id:'00000000-0000-4000-8000-000000000002',sort_order:2,published:true},
    {id:'outreach-adamawa',location:'Adamawa State',title:'Compassion for widows — Yola',date_label:'',description:'A dedicated outreach providing relief items alongside prayer, counseling and emotional encouragement.',stat:'60+ widows',media_id:'00000000-0000-4000-8000-000000000003',sort_order:3,published:true},
  ],
  programs: [
    {id:'program-1',title:'Targeted Aid',description:'Partnering with local orphanages and vulnerable widows, offering financial support to help rebuild local businesses.',media_id:'00000000-0000-4000-8000-000000000003',sort_order:1,published:true},
    {id:'program-2',title:'Teenage & Child Counselling',description:'Emotional healing and mental health guidance sessions that help children and teenagers process silent trauma and build personal hope.',media_id:'00000000-0000-4000-8000-000000000004',sort_order:2,published:true},
    {id:'program-3',title:'Collaborative Interventions',description:'Networking with regional NGOs to scale the reach of community interventions.',media_id:'00000000-0000-4000-8000-000000000002',sort_order:3,published:true},
  ],
  partners: [
    {id:'partner-1',name:'Purpose Ignite Initiative',url:'',sort_order:1,published:true},
    {id:'partner-2',name:'Raising Women Initiative',url:'',sort_order:2,published:true},
    {id:'partner-3',name:'Magdalene Musa Foundation',url:'',sort_order:3,published:true},
  ],
  social_links: [
    {id:'social-whatsapp',platform:'WhatsApp',url:'',sort_order:1,published:true},
    {id:'social-instagram',platform:'Instagram',url:'https://www.instagram.com/melodygaiusfoundation/',sort_order:2,published:true},
    {id:'social-facebook',platform:'Facebook',url:'',sort_order:3,published:true},
    {id:'social-linkedin',platform:'LinkedIn',url:'',sort_order:4,published:true},
  ],
  hero_links: [
    {id:'hero-aviv',label:'Aviv Counseling',url:'',sort_order:1,published:true},
    {id:'hero-foundation',label:'MJ Foundations',url:'',sort_order:2,published:true},
  ],
  outreach_videos: [],
};
