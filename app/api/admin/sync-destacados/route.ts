import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ~5 estrellas por selección, nombres en formato API-Football
const DESTACADOS: Record<string, string[]> = {
  "Argentina":     ["Lionel Messi", "Julián Álvarez", "Rodrigo De Paul", "Alexis Mac Allister", "Enzo Fernández"],
  "Brazil":        ["Vinícius Júnior", "Rodrygo", "Raphinha", "Endrick", "Lucas Paquetá"],
  "France":        ["Kylian Mbappé", "Antoine Griezmann", "Ousmane Dembélé", "Aurélien Tchouaméni", "Eduardo Camavinga"],
  "England":       ["Jude Bellingham", "Bukayo Saka", "Phil Foden", "Harry Kane", "Declan Rice"],
  "Spain":         ["Pedri", "Lamine Yamal", "Álvaro Morata", "Rodri", "Nico Williams"],
  "Germany":       ["Jamal Musiala", "Florian Wirtz", "Kai Havertz", "Joshua Kimmich", "Leroy Sané"],
  "Portugal":      ["Cristiano Ronaldo", "Bruno Fernandes", "Rafael Leão", "Vitinha", "Rúben Dias"],
  "Netherlands":   ["Virgil van Dijk", "Frenkie de Jong", "Cody Gakpo", "Memphis Depay", "Denzel Dumfries"],
  "Belgium":       ["Kevin De Bruyne", "Romelu Lukaku", "Youri Tielemans", "Leandro Trossard", "Axel Witsel"],
  "Italy":         ["Federico Chiesa", "Nicolò Barella", "Gianluigi Donnarumma", "Giacomo Raspadori", "Sandro Tonali"],
  "Croatia":       ["Luka Modrić", "Mateo Kovačić", "Joško Gvardiol", "Ivan Perišić", "Marcelo Brozović"],
  "Uruguay":       ["Federico Valverde", "Darwin Núñez", "Ronald Araújo", "Rodrigo Bentancur", "Luis Suárez"],
  "Colombia":      ["Luis Díaz", "James Rodríguez", "Yerry Mina", "Jhon Córdoba", "Cucho Hernández"],
  "Mexico":        ["Edson Álvarez", "Santiago Giménez", "Hirving Lozano", "Alexis Vega", "Guillermo Ochoa"],
  "United States": ["Christian Pulisic", "Weston McKennie", "Tyler Adams", "Giovanni Reyna", "Folarin Balogun"],
  "Canada":        ["Alphonso Davies", "Jonathan David", "Cyle Larin", "Tajon Buchanan", "Stephen Eustáquio"],
  "Morocco":       ["Hakim Ziyech", "Youssef En-Nesyri", "Achraf Hakimi", "Noussair Mazraoui", "Azzedine Ounahi"],
  "Senegal":       ["Sadio Mané", "Idrissa Gueye", "Ismaïla Sarr", "Boulaye Dia", "Nampalys Mendy"],
  "Nigeria":       ["Ademola Lookman", "Victor Osimhen", "Wilfred Ndidi", "Samuel Chukwueze", "Alex Iwobi"],
  "Egypt":         ["Mohamed Salah", "Mohamed El-Shenawy", "Mostafa Mohamed", "Mahmoud Trezeguet", "Ahmed Hegazi"],
  "Cameroon":      ["Bryan Mbeumo", "Vincent Aboubakar", "André Onana", "Martin Hongla", "Karl Toko Ekambi"],
  "Ghana":         ["Mohammed Kudus", "Jordan Ayew", "Thomas Partey", "Inaki Williams", "Antoine Semenyo"],
  "South Africa":  ["Percy Tau", "Themba Zwane", "Lyle Foster", "Ronwen Williams", "Bongani Zungu"],
  "Tunisia":       ["Youssef Msakni", "Wahbi Khazri", "Ellyes Skhiri", "Seifeddine Jaziri", "Ali Maaloul"],
  "DR Congo":      ["Cédric Bakambu", "Chancel Mbemba", "Yoane Wissa", "Arthur Masuaku", "Théo Bongonda"],
  "Japan":         ["Takefusa Kubo", "Kaoru Mitoma", "Wataru Endo", "Daichi Kamada", "Ritsu Doan"],
  "South Korea":   ["Son Heung-min", "Kim Min-jae", "Hwang Hee-chan", "Lee Jae-sung", "Hwang In-beom"],
  "Australia":     ["Mathew Leckie", "Martin Boyle", "Aaron Mooy", "Mat Ryan", "Jackson Irvine"],
  "Iran":          ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh", "Milad Mohammadi", "Ali Gholizadeh"],
  "Saudi Arabia":  ["Salem Al-Dawsari", "Firas Al-Buraikan", "Mohammed Al-Owais", "Sami Al-Najei", "Yasser Al-Shahrani"],
  "Qatar":         ["Akram Afif", "Almoez Ali", "Abdelkarim Hassan", "Bassam Al-Rawi", "Boualem Khoukhi"],
  "Ecuador":       ["Pervis Estupiñán", "Moisés Caicedo", "Enner Valencia", "Ángel Mena", "Jeremy Sarmiento"],
  "Venezuela":     ["Yeferson Soteldo", "Josef Martínez", "Salomón Rondón", "Darwin Machís", "Jefferson Savarino"],
  "Panama":        ["Rolando Blackburn", "Anibal Godoy", "Fidel Escobar", "Cecilio Waterman", "Adalberto Carrasquilla"],
  "Jamaica":       ["Michail Antonio", "Bobby Reid", "Demarai Gray", "Liam Moore", "Andre Blake"],
  "Honduras":      ["Alberth Elis", "Romell Quioto", "Antony Lozano", "Luis Palma", "Bryan Moya"],
  "Switzerland":   ["Xherdan Shaqiri", "Breel Embolo", "Granit Xhaka", "Manuel Akanji", "Yann Sommer"],
  "Denmark":       ["Christian Eriksen", "Rasmus Højlund", "Pierre-Emile Højbjerg", "Joakim Mæhle", "Kasper Schmeichel"],
  "Poland":        ["Robert Lewandowski", "Piotr Zieliński", "Kamil Szymański", "Wojciech Szczęsny", "Grzegorz Krychowiak"],
  "Serbia":        ["Aleksandar Mitrović", "Dušan Vlahović", "Dušan Tadić", "Sergej Milinković-Savić", "Nemanja Gudelj"],
  "Austria":       ["David Alaba", "Marcel Sabitzer", "Marko Arnautović", "Christoph Baumgartner", "Konrad Laimer"],
  "Scotland":      ["Andrew Robertson", "Scott McTominay", "Lyndon Dykes", "Kieran Tierney", "Ryan Christie"],
  "Ukraine":       ["Mykhailo Mudryk", "Oleksandr Zinchenko", "Viktor Tsygankov", "Roman Yaremchuk", "Andriy Lunin"],
  "Turkey":        ["Hakan Çalhanoğlu", "Arda Güler", "Kenan Yıldız", "Merih Demiral", "Cengiz Ünder"],
  "Czech Republic":["Tomáš Souček", "Patrik Schick", "Vladimír Coufal", "Antonín Barák", "Lukáš Provod"],
  "Romania":       ["Radu Drăgușin", "Florinel Coman", "Ianis Hagi", "Razvan Marin", "Denis Drăguș"],
  "Slovakia":      ["Milan Škriniar", "Marek Hamšík", "Stanislav Lobotka", "Dávid Hancko", "Róbert Boženík"],
  "Hungary":       ["Dominik Szoboszlai", "Roland Sallai", "Loïc Nego", "Barnabás Varga", "Péter Gulácsi"],
  "New Zealand":   ["Chris Wood", "Bill Tuilagi", "Clayton Lewis", "Liberato Cacace", "Joe Bell"],
};

export async function GET() {
  const auth = await createServerClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  let marcados = 0;
  const errores: string[] = [];

  // Reset todos primero
  await supabase.from("jugadores").update({ destacado: false }).neq("id", 0);

  for (const [equipo, jugadores] of Object.entries(DESTACADOS)) {
    // Buscar el team_id
    const { data: sel } = await supabase
      .from("selecciones")
      .select("id")
      .ilike("nombre", equipo)
      .single();

    if (!sel) {
      errores.push(`Selección no encontrada: ${equipo}`);
      continue;
    }

    for (const nombre of jugadores) {
      const apellido = nombre.split(" ").slice(1).join(" ") || nombre;
      const { data, error } = await supabase
        .from("jugadores")
        .update({ destacado: true })
        .eq("team_id", sel.id)
        .or(`nombre.ilike.%${nombre}%,nombre.ilike.%${apellido}%`)
        .select("id, nombre");

      if (error) {
        errores.push(`${nombre}: ${error.message}`);
      } else if (data && data.length > 0) {
        marcados += data.length;
      } else {
        errores.push(`No encontrado: ${nombre} (${equipo})`);
      }
    }
  }

  return NextResponse.json({ ok: true, marcados, errores });
}
