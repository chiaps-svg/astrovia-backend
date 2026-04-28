// data/frasi-previsioni.js
// Tutte le frasi per le previsioni astrologiche - VERSIONE ESTESA

const frasiAspetti = {
  // =======================
  // TRIGONO (armonioso)
  // =======================
  'Trigono': {
    sole: [
      "Il Sole in {segnoNatale} forma un trigono armonioso con {pianetaTransito} in {segnoTransito}. Oggi ti sentirai particolarmente energico e ottimista. Buon momento per iniziative coraggiose.",
      "Trigono tra Sole ({segnoNatale}) e {pianetaTransito} ({segnoTransito}). La tua vitalità è al massimo, le cose fluiscono senza sforzo. Cogli le opportunità che arrivano.",
      "Sole in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Energia creativa e determinazione si fondono, portando risultati sorprendenti.",
      "Il Sole e {pianetaTransito} danzano in armonia. Un giorno perfetto per esprimere la tua autenticità e brillare.",
      "Trigono solare: la tua identità si allinea con le energie cosmiche di {pianetaTransito} in {segnoTransito}. Sentiti libero di osare."
    ],
    luna: [
      "La Luna in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Emozioni in equilibrio, intuizione al top. Giornata ideale per meditare e connetterti con i tuoi sentimenti.",
      "Trigono lunare benefico: {pianetaTransito} in {segnoTransito} supporta la tua Luna in {segnoNatale}. Serenità emotiva, relazioni profonde e autentiche.",
      "Luna in {segnoNatale} e {pianetaTransito} in {segnoTransito}: un abbraccio cosmico che nutre la tua anima. Concediti momenti di dolcezza.",
      "Le tue emozioni trovano un canale di espressione fluido. Oggi è più facile capire cosa vuoi veramente.",
      "Trigono lunare: la tua sensibilità è un superpotere oggi. Usala per connetterti con gli altri in modo autentico."
    ],
    mercurio: [
      "Mercurio in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Mente lucida, comunicazione fluida. Perfetto per studi, riunioni e decisioni importanti.",
      "Mercurio e {pianetaTransito} dialogano in armonia. Idee brillanti, conversazioni stimolanti, apprendimento rapido.",
      "Trigono di Mercurio: la tua mente è come un diamante, lucida e tagliente. Ottimo per risolvere problemi complessi.",
      "Comunicazione e intuito si fondono. Sarai capace di esprimere concetti complessi in modo semplice e convincente.",
      "Mercurio in {segnoNatale} in trigono: scrivere, parlare, insegnare. Oggi le tue parole hanno un peso speciale."
    ],
    venere: [
      "Venere in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Amore e bellezza sono favoriti. Relazioni armoniose, creatività in aumento.",
      "Trigono d'amore: Venere ({segnoNatale}) e {pianetaTransito} ({segnoTransito}). Momento perfetto per dichiarazioni, regali e gesti romantici.",
      "Venere in trigono: l'armonia regna nelle relazioni. Se single, potresti incontrare qualcuno di speciale.",
      "L'energia dell'amore fluisce liberamente. Circondati di bellezza e concediti piccoli piaceri.",
      "Trigono venusiano: la tua capacità di amare e ricevere amore è amplificata. Apri il cuore."
    ],
    marte: [
      "Marte in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Energia positiva, determinazione e coraggio. Ottimo per sport, azioni decisive e nuovi inizi.",
      "Marte e {pianetaTransito} sono alleati oggi. La tua forza interiore è potenziata, nulla ti è impossibile.",
      "Trigono marziano: energia vitale alle stelle. Inizia quel progetto che rimandavi da tempo.",
      "Coraggio e determinazione si fondono. Affronta le sfide con grinta e vedrai che nulla può fermarti.",
      "Marte in trigono: il momento di agire è adesso. Non aspettare, il cielo è dalla tua parte."
    ],
    giove: [
      "Giove in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Espansione e fortuna. Opportunità di crescita, viaggi e successo professionale.",
      "Giove, il pianeta della fortuna, ti sorride attraverso {pianetaTransito} in {segnoTransito}. Aspettati sviluppi positivi inaspettati.",
      "Trigono gioviano: la ruota della fortuna gira a tuo favore. Fai un passo avanti verso i tuoi sogni.",
      "Abbondanza e prosperità sono nell'aria. Sii aperto a ricevere ciò che l'universo ha da offrirti.",
      "Giove in trigono: espandi i tuoi orizzonti, fisicamente o mentalmente. Un viaggio o uno studio potrebbero portare grandi frutti."
    ],
    saturno: [
      "Saturno in {segnoNatale} trigono {pianetaTransito} in {segnoTransito}. Struttura e disciplina premiano i tuoi sforzi. Raccogli ciò che hai seminato.",
      "Trigono di Saturno: il duro lavoro paga. Riconoscimenti e stabilità sono alle porte.",
      "Saturno supporta i tuoi progetti a lungo termine. Oggi puoi fare passi concreti verso i tuoi obiettivi.",
      "La pazienza è la tua virtù oggi. Tutto ciò che hai costruito con costanza ora dà i suoi frutti."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in trigono con {pianetaTransito} in {segnoTransito}. Armonia celeste, tutto scorre. Approfitta di questo momento favorevole.",
      "Trigono benefico tra {pianetaNatale} e {pianetaTransito}. Le energie sono allineate per il tuo benessere.",
      "Un aspetto armonioso che porta facilità e sostegno. Goditi questa giornata di equilibrio."
    ]
  },
  
  // =======================
  // SESTILE (opportunità)
  // =======================
  'Sestile': {
    sole: [
      "Il Sole in {segnoNatale} in sestile con {pianetaTransito} in {segnoTransito}. Un'opportunità si presenta, forse in modo inaspettato. Apri gli occhi.",
      "Sestile solare: una porta si apre davanti a te. Sta a te decidere se attraversarla.",
      "Il Sole ti offre una chance. {pianetaTransito} in {segnoTransito} illumina una strada che prima non vedevi."
    ],
    luna: [
      "Sestile lunare: la tua Luna in {segnoNatale} dialoga con {pianetaTransito} in {segnoTransito}. Un'intuizione potrebbe rivelarsi importante.",
      "La Luna sussurra consigli preziosi. Ascolta le tue emozioni, potrebbero guidarti verso una scoperta."
    ],
    mercurio: [
      "Mercurio in sestile: un'idea brillante potrebbe arrivarti da una conversazione casuale. Sii attento."
    ],
    venere: [
      "Sestile di Venere: un incontro fortuito potrebbe trasformarsi in qualcosa di speciale."
    ],
    marte: [
      "Marte in sestile: un'occasione per agire si presenta. Non lasciartela sfuggire."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in sestile con {pianetaTransito} in {segnoTransito}. Una piccola opportunità si apre davanti a te. Non lasciartela sfuggire.",
      "Sestile tra {pianetaNatale} ({segnoNatale}) e {pianetaTransito} ({segnoTransito}). Le stelle ti offrono un'occasione sottile ma preziosa. Sii attento ai segnali.",
      "Un'energia delicata ma propizia accompagna la giornata. Cogli le occasioni, anche quelle piccole.",
      "Sestile: le circostanze si allineano per favorirti. Fai il primo passo."
    ]
  },
  
  // =======================
  // QUADRATO (tensione)
  // =======================
  'Quadrato': {
    sole: [
      "Il Sole in {segnoNatale} è in quadrato con {pianetaTransito} in {segnoTransito}. Tensione interiore, potresti sentirti in conflitto. Respira e non forzare le situazioni.",
      "Quadrato solare: {pianetaTransito} in {segnoTransito} mette alla prova il tuo Sole in {segnoNatale}. Una sfida da affrontare con pazienza.",
      "Sole in quadrato: potresti sentirti ostacolato oggi. La chiave è adattarsi, non combattere.",
      "Il quadrato tra Sole e {pianetaTransito} crea attrito. Usalo come carburante per crescere, non come freno."
    ],
    luna: [
      "La Luna in {segnoNatale} in quadrato con {pianetaTransito} in {segnoTransito}. Emozioni contrastanti, forse un po' di malinconia. Concediti una pausa.",
      "Quadrato lunare: potresti sentire un peso emotivo. Parla con qualcuno di fiducia, sfogati.",
      "Luna in quadrato: le emozioni sono intense oggi. Non prendere decisioni importanti a caldo."
    ],
    mercurio: [
      "Mercurio in quadrato: possibili incomprensioni e fraintendimenti. Parla chiaro e verifica di essere capito."
    ],
    venere: [
      "Venere in quadrato: tensioni in amore o nelle relazioni. Cerca il dialogo, evita il silenzio."
    ],
    marte: [
      "Marte in quadrato: attenzione all'impulsività. La frustrazione può portare a conflitti inutili.",
      "Quadrato marziano: energia bloccata. Scarica la tensione con attività fisica, invece di reagire impulsivamente."
    ],
    saturno: [
      "Saturno in quadrato: sensazione di responsabilità pesanti. Non tutto dipende da te, impara a delegare."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in quadrato con {pianetaTransito} in {segnoTransito}. Una difficoltà da superare. Crescerai attraverso questa sfida.",
      "Quadrato: ciò che oggi è ostacolo, domani sarà insegnamento. Non mollare.",
      "Tensione nell'aria. Usala come stimolo per cambiare ciò che non funziona."
    ]
  },
  
  // =======================
  // OPPOSIZIONE (equilibrio)
  // =======================
  'Opposizione': {
    sole: [
      "Il Sole in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Tensione tra chi sei e ciò che gli altri vogliono da te. Trova il tuo equilibrio.",
      "Opposizione solare: conflitto tra bisogni personali e relazioni. La diplomazia sarà la tua migliore alleata.",
      "Sole in opposizione: potresti sentirti tirato da due parti opposte. Ascolta entrambe, poi scegli la tua strada."
    ],
    luna: [
      "La Luna in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Relazioni sotto i riflettori, potresti sentirti tirato da due parti opposte."
    ],
    venere: [
      "Venere in opposizione: amore in bilico. Comunica con chiarezza per evitare malintesi."
    ],
    default: [
      "{pianetaNatale} in {segnoNatale} in opposizione con {pianetaTransito} in {segnoTransito}. Un equilibrio delicato da mantenere. Ascolta entrambe le campane.",
      "Opposizione: ciò che sembra un conflitto è in realtà un invito a trovare una sintesi."
    ]
  },
  
  // =======================
  // CONGIUNZIONE (unione)
  // =======================
  'Congiunzione': {
    sole: [
      "Il Sole in {segnoNatale} si congiunge a {pianetaTransito} in {segnoTransito}. Energia potenziata, momento di grande chiarezza e determinazione.",
      "Congiunzione solare: {pianetaTransito} amplifica il tuo Sole in {segnoNatale}. Un giorno importante per te.",
      "Sole e {pianetaTransito} si fondono. La tua identità si arricchisce di nuove qualità."
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

// =======================
// CONSIGLI GENERALI (più varietà)
// =======================
const consigliPositivi = [
  "✨ Le stelle oggi sono allineate per te. Sfrutta questa energia positiva per portare avanti i tuoi progetti.",
  "🌞 Giornata favorevole! Le energie cosmiche sostengono le tue iniziative. Agisci con fiducia.",
  "💫 Un momento di grazia astrale. Approfitta per coltivare relazioni e creatività.",
  "⭐ Le configurazioni planetarie di oggi sono armoniche. Aspettati sincronie e piccole magie.",
  "🌟 Ottime vibrazioni cosmiche. Oggi puoi fare passi avanti importanti.",
  "✨ Energia creativa e propositiva al massimo. Buttati!",
  "🌈 Il cielo ti sorride. È il momento di esprimere la tua vera essenza.",
  "🍀 Fortuna e serendipità sono dalla tua parte. Fidati del processo.",
  "🌻 Le stelle ti invitano a osare. Il rischio calcolato oggi può portare grandi soddisfazioni.",
  "💎 Un giorno prezioso per investire su te stesso e sui tuoi sogni.",
  "🎯 Tutto ciò che inizi oggi ha grandi probabilità di successo. Sfrutta questo momento favorevole.",
  "🌸 Le energie sono fluide e leggere. Goditi la giornata con cuore aperto."
];

const consigliNegativi = [
  "⚠️ Giornata potenzialmente complessa. Prenditi del tempo per riflettere prima di agire.",
  "🌙 Le energie sono contrastanti. La pazienza sarà la tua migliore alleata oggi.",
  "🌀 Possibili tensioni in arrivo. Respira profondamente e non prendere decisioni impulsive.",
  "🛡️ Le stelle suggeriscono cautela. Proteggi la tua energia e scegli le battaglie con saggezza.",
  "⚡ Attenzione alle reazioni impulsive. Conta fino a dieci prima di rispondere.",
  "🌊 Potresti sentirti sotto pressione. Una passeggiata all'aria aperta ti aiuterà a schiarire le idee.",
  "⛈️ Giornata di tempesta emotiva. Cerca un rifugio sicuro e non alimentare i conflitti.",
  "🧘 I transiti odierni indicano possibili frustrazioni. La meditazione può aiutarti a ritrovare la calma.",
  "🕰️ Le cose potrebbero non andare come previsto. Accetta il ritmo dell'universo e adattati.",
  "🎭 Potresti sentirti incompreso. Non prendertela, ognuno vede il mondo col suo filtro.",
  "🌫️ La visibilità è limitata oggi. Meglio rimandare le decisioni importanti a giorni migliori.",
  "⚰️ Lascia andare ciò che non serve più. Questo è un giorno di chiusure e trasformazioni."
];

const consigliNeutri = [
  "⚖️ Giornata equilibrata. Ascolta il tuo intuito e procedi con calma.",
  "🌿 Le stelle ti invitano alla consapevolezza. Osserva senza giudicare.",
  "🕊️ Cielo sereno oggi. Segui il tuo ritmo interiore.",
  "🌸 Le energie sono fluide. Dedica tempo a ciò che ti nutre l'anima.",
  "🌻 Giornata senza particolari scossoni. Sfruttala per organizzare e pianificare.",
  "🍃 Momento di stallo apparente. Usalo per ricaricare le batterie.",
  "📖 Oggi più che mai l'osservazione è la chiave. Guarda, impara, ma non forzare.",
  "🎈 Un giorno come tanti, con piccole gioie nascoste. Sii presente per coglierle.",
  "🪶 Leggerezza e riflessione si alternano. Vivi la giornata con curiosità.",
  "🌙 Né buio né luce piena. Oggi sei in un limbo creativo, aspetta e vedrai."
];

// ESPORTA
module.exports = { 
  frasiAspetti, 
  consigliPositivi, 
  consigliNegativi, 
  consigliNeutri 
};
