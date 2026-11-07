export const SOURCES = ["Website", "LinkedIn", "Referral", "Webinar", "Cold Outreach", "Paid Ads", "Trade Show", "Partner"] as const;
export const STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;

const FIRST = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Daniel","Nancy","Matthew","Lisa","Anthony","Betty","Mark","Margaret","Donald","Sandra","Steven","Ashley","Paul","Kimberly","Andrew","Emily","Joshua","Michelle","Kenneth","Amanda","Kevin","Melissa","Brian","Deborah","George","Rebecca","Timothy","Laura","Ronald","Sharon","Edward","Cynthia","Jason","Kathleen","Jeffrey","Amy","Ryan","Angela","Jacob","Shirley","Gary","Anna","Nicholas","Brenda","Eric","Pamela","Jonathan","Emma","Stephen","Nicole","Larry","Helen","Justin","Samantha","Scott","Katherine","Brandon","Christine","Benjamin","Debra","Samuel","Rachel","Gregory","Carolyn","Frank","Janet","Alexander","Maria","Raymond","Olivia","Patrick","Heather","Jack","Diane","Dennis","Julie","Jerry","Joyce","Tyler","Victoria","Aaron","Kelly","Jose","Christina","Adam","Lauren","Henry","Joan","Nathan","Evelyn","Douglas","Judith","Zachary","Andrea","Kyle","Hannah","Noah","Megan","Ethan","Cheryl","Jeremy","Jacqueline","Walter","Martha","Christian","Madison","Keith","Teresa","Roger","Gloria","Terry","Sara","Austin","Janice","Sean","Grace","Gerald","Julia","Carl","Judy","Harold","Theresa","Dylan","Rose","Jordan","Beverly","Bryan","Denise","Billy","Marilyn","Bruce","Amber","Gabriel","Danielle","Joe","Abigail","Logan","Brittany","Alan","Diana","Juan","Natalie","Albert","Sophia","Willie","Alexa","Philip","Lori","Eugene","Kayla","Randy","Alexis"];
const LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Gomez","Phillips","Evans","Turner","Diaz","Parker","Cruz","Edwards","Collins","Reyes","Stewart","Morris","Morales","Murphy","Cook","Rogers","Gutierrez","Ortiz","Morgan","Cooper","Peterson","Bailey","Reed","Kelly","Howard","Ramos","Kim","Cox","Ward","Richardson","Watson","Brooks","Chavez","Wood","James","Bennett","Gray","Mendoza","Ruiz","Hughes","Price","Alvarez","Castillo","Sanders","Patel","Myers","Long","Ross","Foster","Jimenez","Powell","Jenkins","Perry","Russell","Sullivan","Bell","Coleman","Butler","Henderson","Barnes","Gonzales","Fisher","Vasquez","Simmons","Romero","Jordan","Patterson","Alexander","Hamilton","Graham","Reynolds","Griffin","Wallace","Moreno","West","Cole","Hayes","Bryant","Herrera","Gibson","Ellis","Tran","Medina","Aguilar","Stevens","Murray","Ford","Marshall","Owens","Harrison","Fernandez","Mcdonald","Woods","Washington","Kennedy","Wells","Vargas","Henry","Chen","Freeman","Webb","Tucker","Guzman","Burns","Crawford","Jimenez","Meyer","Shaw","Morales","Simpson","Crawford","Garza","Ortiz","Wade","Delgado","Grant","Sharp","Munoz","Walsh","Little","Fowler","Sharp"];
const COMPANY_A = ["North","Blue","Prime","Nova","Apex","Summit","Vertex","Pioneer","Quantum","Stellar","Forge","Atlas","Beacon","Cedar","Harbor","Iron","Lumen","Orbit","Pulse","Ridge","Solar","Titan","Urban","Vantage","Willow","Zenith","Echo","Falcon","Granite","Helix","Ion","Jade","Kite","Legacy","Metro","Noble","Onyx","Peak","Quest","River","Stone","Terra","Unity","Valor","Wave","York","Zephyr"];
const COMPANY_B = ["Labs","Systems","Works","Group","Industries","Ventures","Solutions","Technologies","Partners","Collective","Dynamics","Holdings","Studio","Networks","Analytics","Logistics","Health","Foods","Energy","Media","Capital","Software","Robotics","Biotech","Cloud","Security"];
const TITLES = ["CEO","Founder","VP Sales","VP Marketing","Head of Growth","Operations Manager","Procurement Lead","CTO","Product Manager","Sales Director","Marketing Director","Owner","General Manager","Head of Finance","Customer Success Lead","Business Development Manager","IT Manager","Office Manager","Executive Director","Chief Revenue Officer"];
const CITIES: [string,string][] = [["New York","USA"],["Los Angeles","USA"],["Chicago","USA"],["Houston","USA"],["Austin","USA"],["Seattle","USA"],["Denver","USA"],["Miami","USA"],["Boston","USA"],["Atlanta","USA"],["London","UK"],["Toronto","Canada"],["Berlin","Germany"],["Sydney","Australia"],["Singapore","Singapore"],["Dubai","UAE"],["Amsterdam","Netherlands"],["Dublin","Ireland"],["Paris","France"],["Tokyo","Japan"]];

function pick<T>(arr: readonly T[] | T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// Deterministic-ish pseudo random from seed
function rand(seed: number) {
  const x = Math.sin(seed * 99991 + 12345) * 10000;
  return x - Math.floor(x);
}

export type GeneratedLead = {
  firstName: string; lastName: string; email: string; phone: string; company: string;
  jobTitle: string; source: string; status: string; score: number; estimatedValue: number;
  city: string; country: string; batchId: number; batchLabel: string;
};

export function generateLeads(count: number, batchId: number, batchLabel: string, offset: number): GeneratedLead[] {
  const rows: GeneratedLead[] = [];
  for (let i = 0; i < count; i++) {
    const seq = offset + i;
    const s = seq * 7 + batchId * 131;
    const first = pick(FIRST, Math.floor(rand(s) * 100000));
    const last = pick(LAST, Math.floor(rand(s + 1) * 100000));
    const [city, country] = pick(CITIES, Math.floor(rand(s + 2) * 100000));
    const company = `${pick(COMPANY_A, Math.floor(rand(s+3)*100000))} ${pick(COMPANY_B, Math.floor(rand(s+4)*100000))}`;
    const score = 8 + Math.floor(rand(s + 5) * 93);
    // Weighted status by score
    let status: string;
    const r = rand(s + 6);
    if (score > 82) status = r < 0.28 ? "Won" : r < 0.55 ? "Negotiation" : r < 0.78 ? "Proposal" : "Qualified";
    else if (score > 55) status = r < 0.35 ? "Qualified" : r < 0.6 ? "Contacted" : r < 0.8 ? "Proposal" : "New";
    else if (score > 30) status = r < 0.45 ? "New" : r < 0.75 ? "Contacted" : r < 0.9 ? "Qualified" : "Lost";
    else status = r < 0.5 ? "New" : r < 0.8 ? "Contacted" : "Lost";

    const domain = company.toLowerCase().replace(/[^a-z ]/g, "").trim().split(" ").join("") + ".com";
    rows.push({
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${seq}@${domain}`,
      phone: `+1 (${200 + Math.floor(rand(s+7)*700)}) ${200 + Math.floor(rand(s+8)*800)}-${1000 + Math.floor(rand(s+9)*9000)}`,
      company,
      jobTitle: pick(TITLES, Math.floor(rand(s+10)*100000)),
      source: pick(SOURCES as unknown as string[], Math.floor(rand(s+11)*100000)),
      status,
      score,
      estimatedValue: Math.round((500 + rand(s+12) * 49500) / 100) * 100,
      city, country, batchId, batchLabel,
    });
  }
  return rows;
}
