// data/frasi-previsioni.js
// Tutte le frasi per le previsioni astrologiche

const frasiAspetti = {
  // ASPETTI POSITIVI
  'Trigono': {
    sole: [
      "Il Sole in {segnoNatale} forma un trigono armonioso con {pianetaTransito} in {segnoTransito}. Oggi ti sentirai particolarmente energico e ottimista. Buon momento per iniziative coraggiose.",
      "Trigono tra Sole ({segnoNatale}) e {pianetaTransito} ({segnoTransito}). La tua vitalità è al massimo, le cose fluiscono senza sforzo. Cogli le opportunità che arrivano."
    ],
    luna: [
      "La Luna in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Emozioni in equilibrio, intuizione al top. Giornata ideale per meditare e connetterti con i tuoi sentimenti.",
      "Trigono lunare benefico: {pianetaTransito} in {segnoTransito} supporta la tua Luna in {segnoNatale}. Serenità emotiva, relazioni profonde e autentiche."
    ],
    mercurio: [
      "Mercurio in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Mente lucida, comunicazione fluida. Perfetto per studi, riunioni e decisioni importanti."
    ],
    venere: [
      "Venere in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Amore e bellezza sono favoriti. Relazioni armoniose, creatività in aumento.",
      "Trigono d'amore: Venere ({segnoNatale}) e {pianetaTransito} ({segnoTransito}). Momento perfetto per dichiarazioni, regali e gesti romantici."
    ],
    marte: [
      "Marte in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Energia positiva, determinazione e coraggio. Ottimo per sport, azioni decisive e nuovi inizi."
    ],
    giove: [
      "Giove in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Espansione e fortuna. Opportunità di crescita, viaggi e successo professionale."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Armonia celeste, tutto scorre. Approfitta di questo momento favorevole."
    ]
  },
  
  'Sestile': {
    default: [
      "{pianetaNatale} in {segnoNatale} in sestile con {pianetaTransito} in {segnoTransito}. Una piccola opportunità si apre davanti a te. Non lasciartela sfuggire.",
      "Sestile tra {pianetaNatale} ({segnoNatale}) e {pianetaTransito} ({segnoTransito}). Le stelle ti offrono un'occasione sottile ma preziosa. Sii attento ai segnali."
    ],
    sole: [
      "Il Sole in {segnoNatale} in sestile con {pianetaTransito} in {segnoTransito}. Un'opportunità si presenta, forse in modo inaspettato. Apri gli occhi."
    ],
    luna: [
      "Sestile lunare: la tua Luna in {segnoNatale} dialoga con {pianetaTransito} in {segnoTransito}. Un'intuizione potrebbe rivelarsi importante."
    ]
  },
  
  // ASPETTI NEGATIVI
  'Quadrato': {
    sole: [
      "Il Sole in {segnoNatale} è in quadrato con {pianetaTransito} in {segnoTransito}. Tensione interiore, potresti sentirti in conflitto. Respira e non forzare le situazioni.",
      "Quadrato solare: {pianetaTransito} in {segnoTransito} mette alla prova il tuo Sole in {segnoNatale}. Una sfida da affrontare con pazienza."
    ],
    luna: [
      "La Luna in {segnoNatale} in quadrato con {pianetaTransito} in {segnoTransito}. Emozioni contrastanti, forse un po' di malinconia. Concediti una pausa.",
      "Quadrato lunare: potresti sentire un peso emotivo. Parla con qualcuno di fiducia, sfogati."
    ],
    marte: [
      "Marte in {segnoNatale} in quadrato con {pianetaTransito} in {segnoTransito}. Attenzione all'impulsività. La frustrazione può portare a conflitti inutili.",
      "Quadrato marziano: energia bloccata. Scarica la tensione con attività fisica, invece di reagire impulsivamente."
    ],
    saturno: [
      "Saturno in {segnoNatale} in quadrato con {pianetaTransito} in {segnoTransito}. Sensazione di responsabilità pesanti. Non tutto dipende da te, impara a delegare."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in quadrato con {pianetaTransito} in {segnoTransito}. Una difficoltà da superare. Crescerai attraverso questa sfida."
    ]
  },
  
  'Opposizione': {
    sole: [
      "Il Sole in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Tensione tra chi sei e ciò che gli altri vogliono da te. Trova il tuo equilibrio.",
      "Opposizione solare: conflitto tra bisogni personali e relazioni. La diplomazia sarà la tua migliore alleata."
    ],
    luna: [
      "La Luna in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Relazioni sotto i riflettori, potresti sentirti tirato da due parti opposte."
    ],
    venere: [
      "Venere in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Amore in bilico. Comunica con chiarezza per evitare malintesi."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Un equilibrio delicato da mantenere. Ascolta entrambe le campane."
    ]
  },
  
  // CONGIUNZIONI
  'Congiunzione': {
    sole: [
      "Il Sole in {segnoNatale} si congiunge a {pianetaTransito} in {segnoTransito}. Energia potenziata, momento di grande chiarezza e determinazione.",
      "Congiunzione solare: {pianetaTransito} amplifica il tuo Sole in {segnoNatale}. Un giorno importante per te."
    ],
    luna: [
      "La Luna in {segnoNatale} si unisce a {pianetaTransito} in {segnoTransito}. Emozioni intense, intuizione fortissima. Ascolta il tuo cuore."
    ],
    venere: [
      "Venere in {segnoNatale} in congiunzione con {pianetaTransito} in {segnoTransito}. Amore e armonia al centro della giornata. Relazioni speciali."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in congiunzione con {pianetaTransito} in {segnoTransito}. Energie che si fondono, concentrazione e determinazione."
    ]
  }
};

// CONSIGLI GENERALI
const consigliPositivi = [
  "✨ Le stelle oggi sono allineate per te. Sfrutta questa energia positiva per portare avanti i tuoi progetti.",
  "🌞 Giornata favorevole! Le energie cosmiche sostengono le tue iniziative. Agisci con fiducia.",
  "💫 Un momento di grazia astrale. Approfitta per coltivare relazioni e creatività.",
  "⭐ Le configurazioni planetarie di oggi sono armoniche. Aspettati sincronie e piccole magie.",
  "🌟 Ottime vibrazioni cosmiche. Oggi puoi fare passi avanti importanti.",
  "✨ Energia creativa e propositiva al massimo. Buttati!"
];

const consigliNegativi = [
  "⚠️ Giornata potenzialmente complessa. Prenditi del tempo per riflettere prima di agire.",
  "🌙 Le energie sono contrastanti. La pazienza sarà la tua migliore alleata oggi.",
  "🌀 Possibili tensioni in arrivo. Respira profondamente e non prendere decisioni impulsive.",
  "🛡️ Le stelle suggeriscono cautela. Proteggi la tua energia e scegli le battaglie con saggezza.",
  "⚡ Attenzione alle reazioni impulsive. Conta fino a dieci prima di rispondere.",
  "🌊 Potresti sentirti sotto pressione. Una passeggiata all'aria aperta ti aiuterà a schiarire le idee."
];

const consigliNeutri = [
  "⚖️ Giornata equilibrata. Ascolta il tuo intuito e procedi con calma.",
  "🌿 Le stelle ti invitano alla consapevolezza. Osserva senza giudicare.",
  "🕊️ Cielo sereno oggi. Segui il tuo ritmo interiore.",
  "🌸 Le energie sono fluide. Dedica tempo a ciò che ti nutre l'anima.",
  "🌻 Giornata senza particolari scossoni. Sfruttala per organizzare e pianificare.",
  "🍃 Momento di stallo apparente. Usalo per ricaricare le batterie."
];

// ESPORTA
module.exports = { frasiAspetti, consigliPositivi, consigliNegativi, consigliNeutri };
