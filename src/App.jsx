"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    updateProfile 
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, addDoc, deleteDoc, onSnapshot, query, serverTimestamp } from "firebase/firestore";

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyBWfltSYdePaa9XZBiR19hDLLWY73f8618",
  authDomain: "pvzwiki-9a449.firebaseapp.com",
  projectId: "pvzwiki-9a449",
  storageBucket: "pvzwiki-9a449.firebasestorage.app",
  messagingSenderId: "647385958276",
  appId: "1:647385958276:web:5a70e09c166b6391e67fd1",
  measurementId: "G-B8V9DKN3DD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'pvz-wiki-live'; 

// --- DATA ---
const plantsDB = [
    // --- DÍA ---
    { 
        id: 1, type: 'plants', name: "Lanzaguisantes", cost: 100, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara un guisante cada 1.5 segundos a los zombis que aparezcan en su línea. Es la unidad básica de ofensa.", 
        history: "¿Cómo pueden crecer y disparar guisantes tan rápido? Lanzaguisantes dice: 'Entrega, trabajo duro y una dieta rica en luz solar y dióxido de carbono saludable lo hace todo posible'.", 
        color: "from-green-500 to-green-700", icon: "🌱" 
    },
    { 
        id: 2, type: 'plants', name: "Girasol", cost: 50, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Produce 25 unidades de sol cada 24 segundos. Es vital plantar al menos dos filas para mantener la economía.", 
        history: "Girasol no puede resistir moverse al son de la melodía. ¿Cuál? La melodía vivificante de la Tierra misma, latiendo en una frecuencia que solo ella puede oír.", 
        color: "from-yellow-400 to-yellow-600", icon: "🌻" 
    },
    { 
        id: 3, type: 'plants', name: "Petacereza", cost: 150, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Explota en un área de 3x3 casillas casi instantáneamente, incinerando a la mayoría de zombis al contacto.", 
        history: "'¡Quiero explotar!', dice Petacereza. 'No, espera. ¡Queremos explotar!'. 'De acuerdo, explotemos'. '¡¡No!! ¡Esperad un poco más!'.", 
        color: "from-red-600 to-red-800", icon: "🍒" 
    },
    { 
        id: 4, type: 'plants', name: "Nuez", cost: 50, recharge: "Lenta", damage: "N/A", 
        desc: "Mecánica: Posee una salud elevada (4000 puntos de daño). Sirve de escudo para proteger a tus plantas ofensivas mientras se recargan.", 
        history: "'¡La gente se pregunta qué se siente al ser mordisqueada constantemente por los zombis!', dice la Nuez. 'No sé, yo no siento nada, la verdad. Solo me dan un pequeño masaje'.", 
        color: "from-amber-600 to-amber-800", icon: "🌰" 
    },
    { 
        id: 5, type: 'plants', name: "Patatapum", cost: 25, recharge: "Lenta", damage: "Masivo", 
        desc: "Mecánica: Mina terrestre barata. Tarda 14 segundos en armarse bajo tierra. Al contacto, explota y elimina a un zombi.", 
        history: "Algunos dicen que Patatapum es un poco vaga, que lo deja todo para el último momento. Patatapum dice que nada de eso, que ella invierte su tiempo.", 
        color: "from-yellow-700 to-yellow-900", icon: "🥔" 
    },
    { 
        id: 6, type: 'plants', name: "Hielaguisantes", cost: 175, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara guisantes helados que ralentizan a los zombis al 50% de velocidad y reducen su cadencia de ataque.", 
        history: "La gente a menudo le dice a Hielaguisantes lo 'frío' que es, o le dicen que 'se relaje'. Él simplemente pone los ojos en blanco.", 
        color: "from-blue-400 to-blue-600", icon: "❄️" 
    },
    { 
        id: 7, type: 'plants', name: "Planta Carnívora", cost: 150, recharge: "Rápido", damage: "Masivo", 
        desc: "Mecánica: Devora un zombi entero de un bocado (incluso con cubos), pero queda vulnerable durante 42 segundos mientras mastica.", 
        history: "Planta Carnívora podría protagonizar 'La tienda de los horrores', si quisiera. Su agente está negociando el contrato.", 
        color: "from-purple-600 to-purple-900", icon: "🦷" 
    },
    { 
        id: 8, type: 'plants', name: "Repetidora", cost: 200, recharge: "Rápido", damage: "Normal (x2)", 
        desc: "Mecánica: Dispara dos guisantes seguidos por turno. Doble potencia de fuego en el mismo espacio que un Lanzaguisantes.", 
        history: "Repetidora es feroz. Proviene de la calle. No acepta un 'no' por respuesta, ni tampoco un 'sí' o un 'quizá'.", 
        color: "from-green-700 to-green-900", icon: "🔫" 
    },

    // --- NOCHE ---
    { 
        id: 9, type: 'plants', name: "Seta Desesporada", cost: 0, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Gratis pero de corto alcance (3 casillas). Ideal para el inicio de niveles nocturnos. Duerme de día.", 
        history: "'Soy pequeño', dice Seta Desesporada, 'pero soy matón. A veces me encuentro a algún amigo zombi y le digo que se ande con ojo'.", 
        color: "from-purple-400 to-purple-600", icon: "🍄" 
    },
    { 
        id: 10, type: 'plants', name: "Seta Solar", cost: 25, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Produce 15 soles al inicio. Tras 2 minutos crece y empieza a producir 25 soles (como un Girasol).", 
        history: "A Seta Solar no le gusta el sol. De hecho, lo odia tanto que cuando lo produce, lo escupe lo más rápido que puede.", 
        color: "from-yellow-300 to-yellow-500", icon: "🌕" 
    },
    { 
        id: 11, type: 'plants', name: "Humoseta", cost: 75, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara burbujas que atraviesan puertas de pantalla y escaleras. Daña a todos los zombis en su rango de 4 casillas.", 
        history: "'Tengo un buen trabajo', dice Humoseta. 'Me lo paso bomba reventando zombis. Pagan bien y tengo buenas prestaciones'.", 
        color: "from-purple-500 to-fuchsia-700", icon: "💨" 
    },
    { 
        id: 12, type: 'plants', name: "Comepiedras", cost: 75, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Se planta sobre lápidas para destruirlas y obtener una moneda de plata (o a veces oro/diamante en Zen).", 
        history: "A pesar de su apariencia feroz, Comepiedras quiere que todos sepan que ama a los gatitos y que pasa su tiempo libre de voluntario.", 
        color: "from-gray-600 to-gray-800", icon: "🪦" 
    },
    { 
        id: 13, type: 'plants', name: "Hipnoseta", cost: 75, recharge: "Lenta", damage: "N/A", 
        desc: "Mecánica: Cuando un zombi la come, se vuelve contra sus compañeros y ataca a otros zombis. Efecto permanente.", 
        history: "Hipnoseta no tiene ni idea de lo que está pasando. Le da todo vueltas y le salen colores de los ojos.", 
        color: "from-pink-400 to-purple-500", icon: "😵" 
    },
    { 
        id: 14, type: 'plants', name: "Seta Miedica", cost: 25, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara lejos como un Lanzaguisantes, pero se esconde y deja de atacar si un zombi se acerca demasiado.", 
        history: "'¿Quién está ahí?', susurra Seta Miedica. 'Por favor, vete. No quiero ver a nadie. A menos que seas del circo'.", 
        color: "from-indigo-400 to-indigo-600", icon: "😨" 
    },
    { 
        id: 15, type: 'plants', name: "Seta Congelada", cost: 75, recharge: "Muy Lenta", damage: "N/A", 
        desc: "Mecánica: Congela instantáneamente a todos los zombis en pantalla, deteniéndolos brevemente y ralentizándolos después.", 
        history: "Seta Congelada frunce el ceño, no porque esté enfadada, sino porque hace mucho frío y no puede evitarlo.", 
        color: "from-cyan-300 to-blue-500", icon: "🧊" 
    },
    { 
        id: 16, type: 'plants', name: "Petaseta", cost: 125, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Explota en una zona masiva, eliminando casi todo. Deja un cráter en el suelo donde no se puede plantar por un tiempo.", 
        history: "'Tienes suerte de que esté de tu parte', dice Petaseta. 'Podría destruir todo lo que ves. No me provoques'.", 
        color: "from-gray-800 to-black", icon: "💣" 
    },

    // --- PISCINA ---
    { 
        id: 17, type: 'plants', name: "Nenúfar", cost: 25, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Plataforma acuática. Permite plantar plantas terrestres sobre las líneas de piscina.", 
        history: "Nenúfar nunca se queja. Nenúfar nunca quiere saber nada de lo que pasa. Ponle una planta encima y no dirá nada.", 
        color: "from-green-400 to-emerald-600", icon: "🥘" 
    },
    { 
        id: 18, type: 'plants', name: "Apisonaflor", cost: 50, recharge: "Lenta", damage: "Masivo", 
        desc: "Mecánica: Salta y aplasta al primer zombi que se acerque a ella (delante o detrás). Muerte instantánea para la mayoría.", 
        history: "'¡Estoy listo!', grita Apisonaflor. '¡Vamos! ¡Ponédmelo delante! ¡Estoy esperando! ¡Es el día del juicio!'", 
        color: "from-green-600 to-green-800", icon: "😠" 
    },
    { 
        id: 19, type: 'plants', name: "Tripitidora", cost: 325, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara guisantes en tres líneas: la suya, la superior y la inferior. Gran cobertura de área.", 
        history: "A Tripitidora le gusta leer, jugar al backgammon y pasar largos periodos de tiempo inmóvil en el parque.", 
        color: "from-green-500 to-lime-600", icon: "🌲" 
    },
    { 
        id: 20, type: 'plants', name: "Zampalga", cost: 25, recharge: "Lenta", damage: "Masivo", 
        desc: "Mecánica: Planta acuática trampa. Arrastra al primer zombi que la toque bajo el agua y lo ahoga.", 
        history: "Zampalga es la reina de la piscina. No la mires a los ojos. No le hables. Ni se te ocurra tocarla.", 
        color: "from-emerald-700 to-teal-900", icon: "🌿" 
    },
    { 
        id: 21, type: 'plants', name: "Jalapeño", cost: 125, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Explota y crea una línea de fuego que incinera a todos los zombis de esa fila. Derrite bolas de hielo.", 
        history: "'¡nnnNNNGGGHHH!', dice Jalapeño. No va a explotar todavía, no, todavía no, espera... ¡AHORA!", 
        color: "from-red-500 to-orange-600", icon: "🌶️" 
    },
    { 
        id: 22, type: 'plants', name: "Pinchohierba", cost: 100, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Daña los pies de los zombis que caminan sobre ella. Revienta instantáneamente neumáticos y Zombistrols (pero muere).", 
        history: "A Pinchohierba le encanta el hockey sobre hielo. Tiene entradas para toda la temporada.", 
        color: "from-gray-500 to-green-900", icon: "🗡️" 
    },
    { 
        id: 23, type: 'plants', name: "Plantorcha", cost: 175, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Convierte los guisantes que pasan a través de ella en bolas de fuego (doble daño + salpicadura). Derrite el hielo.", 
        history: "Todo el mundo aprecia a Plantorcha por su integridad, su amistad y su gran iluminación.", 
        color: "from-orange-500 to-red-500", icon: "🔥" 
    },
    { 
        id: 24, type: 'plants', name: "Nuez Cáscara-rabias", cost: 125, recharge: "Lenta", damage: "N/A", 
        desc: "Mecánica: Muralla defensiva muy resistente. Es tan alta que los zombis saltadores o delfines no pueden saltarla.", 
        history: "La gente piensa que Nuez Cáscara-rabias es un muro de hormigón. Pero la verdad es que es un trozo de pan.", 
        color: "from-amber-800 to-stone-800", icon: "🗿" 
    },

    // --- NIEBLA ---
    { 
        id: 25, type: 'plants', name: "Seta Marina", cost: 0, recharge: "Lenta", damage: "Normal", 
        desc: "Mecánica: Versión acuática de la Seta Desesporada. Gratis, corto alcance, y solo se puede plantar en agua.", 
        history: "Seta Marina nunca ha visto el mar. Está en su lista de cosas que hacer.", 
        color: "from-teal-400 to-cyan-600", icon: "🌊" 
    },
    { 
        id: 26, type: 'plants', name: "Planterna", cost: 25, recharge: "Lenta", damage: "N/A", 
        desc: "Mecánica: Disipa la niebla en un área grande, revelando zombis ocultos. No ataca.", 
        history: "Planterna desafía a la ciencia. ¿Cómo puede una planta emitir luz sin una batería? Es un misterio.", 
        color: "from-yellow-200 to-orange-300", icon: "💡" 
    },
    { 
        id: 27, type: 'plants', name: "Cactus", cost: 125, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara espinas que dañan a zombis terrestres y explotan los globos de los Zombis con Globo.", 
        history: "Es susceptible... muy espinosa. Le gusta que la abracen, pero la gente se mantiene alejada.", 
        color: "from-green-600 to-emerald-700", icon: "🌵" 
    },
    { 
        id: 28, type: 'plants', name: "Trebolador", cost: 100, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Uso único. Genera un viento fuerte que disipa toda la niebla y expulsa a todos los zombis voladores del mapa.", 
        history: "Cuando Trebolador cumple años, recibe una tarta de cumpleaños. La apaga de un soplido.", 
        color: "from-green-300 to-teal-400", icon: "🍀" 
    },
    { 
        id: 29, type: 'plants', name: "Bipetidora", cost: 125, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara un guisante hacia adelante y dos hacia atrás. Ideal contra mineros que atacan por la retaguardia.", 
        history: "Sí, son siameses. 'Tenemos una relación de amor-odio', dice la cabeza delantera.", 
        color: "from-green-600 to-lime-700", icon: "↔️" 
    },
    { 
        id: 30, type: 'plants', name: "Frustrella", cost: 125, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Dispara estrellas en 5 direcciones (atrás, arriba, abajo, diagonales). Inútil si el zombi está justo enfrente.", 
        history: "'¡Eh, tío!', dice Frustrella. '¡Un día fui al dentista y me dijo que tenía cuatro caries!'.", 
        color: "from-yellow-400 to-orange-400", icon: "⭐" 
    },
    { 
        id: 31, type: 'plants', name: "Calabaza", cost: 125, recharge: "Lenta", damage: "N/A", 
        desc: "Mecánica: Se planta SOBRE otra planta para darle una armadura extra de protección contra mordiscos.", 
        history: "Calabaza no tiene familia. Es un pariente lejano de Nuez, pero no se hablan.", 
        color: "from-orange-500 to-orange-700", icon: "🎃" 
    },
    { 
        id: 32, type: 'plants', name: "Magnetoseta", cost: 100, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Roba objetos metálicos (cubos, cascos, escaleras, cajas, picos) de los zombis cercanos, debilitándolos.", 
        history: "El magnetismo es una fuerza poderosa. Muy poderosa. A veces asusta a Magnetoseta.", 
        color: "from-red-600 to-gray-400", icon: "🧲" 
    },

    // --- TEJADO ---
    { 
        id: 33, type: 'plants', name: "Coltapulta", cost: 100, recharge: "Rápido", damage: "Normal", 
        desc: "Mecánica: Catapulta coles que pasan por encima de las defensas (escudos) y del desnivel del tejado.", 
        history: "A Coltapulta le parece bien lanzar verduras a los zombis. Es lo que mejor sabe hacer.", 
        color: "from-green-400 to-green-600", icon: "🥬" 
    },
    { 
        id: 34, type: 'plants', name: "Lanzamaíz", cost: 100, recharge: "Rápido", damage: "Bajo/Alto", 
        desc: "Mecánica: Lanza granos de maíz (daño bajo) y aleatoriamente mantequilla, que paraliza al zombi unos segundos.", 
        history: "Lanzamaíz es el mayor de los hermanos pult. Es el único que recuerda los cumpleaños de los demás.", 
        color: "from-yellow-300 to-yellow-600", icon: "🌽" 
    },
    { 
        id: 35, type: 'plants', name: "Grano de Café", cost: 75, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Se planta sobre las setas dormidas durante el día para despertarlas permanentemente.", 
        history: "'¡Eh, tíos!', dice Grano de Café. '¡Estoy despierto! ¡Y vosotros también deberíais estarlo!'", 
        color: "from-amber-700 to-yellow-900", icon: "☕" 
    },
    { 
        id: 36, type: 'plants', name: "Ajo", cost: 50, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Cuando un zombi lo muerde, hace un gesto de asco y se cambia a la línea adyacente (arriba o abajo).", 
        history: "El Ajo es un experto desviando la atención. Tiene un doctorado en Desviación.", 
        color: "from-white to-gray-200", icon: "🧄" 
    },
    { 
        id: 37, type: 'plants', name: "Paraplanta", cost: 100, recharge: "Rápido", damage: "N/A", 
        desc: "Mecánica: Protege a las plantas adyacentes de ataques aéreos como los Zombis Colgados o las pelotas de baloncesto.", 
        history: "A Paraplanta le gusta mantener a sus amigos secos y a salvo. Es muy maternal.", 
        color: "from-green-500 to-emerald-600", icon: "🍃" 
    },
    { 
        id: 38, type: 'plants', name: "Margarita", cost: 50, recharge: "Lenta", damage: "N/A", 
        desc: "Mecánica: Genera monedas de oro y plata con el tiempo. Útil para farmear dinero en modos fáciles.", 
        history: "Margarita pasa mucho tiempo decidiendo si debe o no debe soltar una moneda.", 
        color: "from-white to-yellow-300", icon: "🌼" 
    },
    { 
        id: 39, type: 'plants', name: "Melonpulta", cost: 300, recharge: "Rápido", damage: "Masivo", 
        desc: "Mecánica: Lanza sandías que causan gran daño al objetivo y daño de salpicadura a los zombis cercanos.", 
        history: "Nadie se mete con Melonpulta. Nadie. Ni siquiera Zombistein.", 
        color: "from-green-500 to-green-800", icon: "🍈" 
    },

    // --- MEJORAS Y ESPECIALES ---
    { 
        id: 40, type: 'plants', name: "Guisantralladora", cost: 250, recharge: "Muy Lenta", damage: "Normal (x4)", 
        desc: "Mecánica: Mejora de la Repetidora. Dispara cuatro guisantes en ráfaga rápida.", 
        history: "Guisantralladora anunció que iba a alistarse en el ejército. Sus padres estaban muy preocupados.", 
        color: "from-green-800 to-emerald-900", icon: "🪖" 
    },
    { 
        id: 41, type: 'plants', name: "Birasol", cost: 150, recharge: "Muy Lenta", damage: "N/A", 
        desc: "Mecánica: Mejora del Girasol. Produce el doble de sol (50 unidades) de golpe.", 
        history: "Birasol es una planta de alta costura. Siempre va a la última moda.", 
        color: "from-yellow-400 to-orange-500", icon: "👭" 
    },
    { 
        id: 42, type: 'plants', name: "Gasoseta", cost: 150, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Mejora de la Humoseta. Dispara humos en un área de 3x3 alrededor de ella, atravesando escudos.", 
        history: "A Gasoseta le gusta ser el centro de atención. Siempre tiene algo que decir.", 
        color: "from-purple-600 to-fuchsia-800", icon: "🌫️" 
    },
    { 
        id: 43, type: 'plants', name: "Rabo de Gato", cost: 225, recharge: "Muy Lenta", damage: "Normal", 
        desc: "Mecánica: Mejora del Nenúfar. Dispara espinas teledirigidas a cualquier zombi del mapa, incluso globos.", 
        history: "¡Guau! ¡Guau! Rabo de Gato está confundido. ¿Es un gato? ¿Es una planta?", 
        color: "from-amber-600 to-orange-700", icon: "🐱" 
    },
    { 
        id: 44, type: 'plants', name: "Melonpulta Cong.", cost: 200, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Mejora de la Melonpulta. Lanza sandías heladas que dañan y ralentizan grupos de zombis.", 
        history: "Intenta mantener la calma, pero a veces simplemente se congela bajo presión.", 
        color: "from-cyan-400 to-blue-600", icon: "🍧" 
    },
    { 
        id: 45, type: 'plants', name: "Magnetoseta Dor.", cost: 50, recharge: "Muy Lenta", damage: "N/A", 
        desc: "Mecánica: Mejora de la Magnetoseta. Atrae automáticamente monedas y diamantes hacia ti.", 
        history: "A Magnetoseta Dorada no le importa el cerebro. Solo le importa el dinero.", 
        color: "from-yellow-400 to-yellow-600", icon: "💰" 
    },
    { 
        id: 46, type: 'plants', name: "Pinchorroca", cost: 125, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Mejora de la Pinchohierba. Hace el doble de daño y puede soportar hasta 3 golpes de Zombistein.", 
        history: "Pinchorroca acaba de volver de un viaje a Europa. Se lo ha pasado en grande.", 
        color: "from-gray-500 to-slate-700", icon: "🏔️" 
    },
    { 
        id: 47, type: 'plants', name: "Mazorcañón", cost: 500, recharge: "Muy Lenta", damage: "Masivo", 
        desc: "Mecánica: Ocupa 2 casillas horizontales. Debes hacer clic para disparar un misil explosivo a cualquier parte del mapa.", 
        history: "Mazorcañón fue a Harvard. Sabe de leyes. No le preguntes por qué.", 
        color: "from-yellow-300 to-yellow-500", icon: "🌽" 
    },
    { 
        id: 48, type: 'plants', name: "Imitadora", cost: 0, recharge: "Muy Lenta", damage: "Variable", 
        desc: "Mecánica: Te permite elegir una misma planta dos veces en tu selección de semillas, duplicando su disponibilidad.", 
        history: "Imitadora tuvo una crisis de identidad en el instituto. Ahora está mejor.", 
        color: "from-gray-300 to-gray-500", icon: "🎭" 
    },
    { 
        id: 49, type: 'plants', name: "Margarita Zen", cost: 0, recharge: "N/A", damage: "N/A", 
        desc: "Mecánica: Planta exclusiva del Jardín Zen. No se usa en combate, solo para decorar y ganar dinero.", 
        history: "Vive feliz en tu jardín zen dándote monedas sin parar.", 
        color: "from-pink-300 to-pink-500", icon: "🪴" 
    },
];

const zombiesDB = [
    { 
        id: 1, type: 'zombies', name: "Zombi", toughness: "Baja", speed: "Básico", 
        desc: "Mecánica: Zombi de jardín común. Sin habilidades especiales, es el más débil.", 
        description: "Este zombi ama los cerebros. No se detendrá ante nada para conseguirlos. No le importa el dolor, ni el frío, ni el calor. Solo quiere comer tu cerebro.", 
        color: "from-gray-500 to-gray-700", icon: "🧟" 
    },
    { 
        id: 2, type: 'zombies', name: "Zombi Abanderado", toughness: "Baja", speed: "Básico", 
        desc: "Mecánica: Marca la llegada de una enorme oleada de zombis. Ligeramente más rápido que el normal.", 
        description: "No te equivoques, le encanta su bandera. De hecho tiene una pegatina en el parachoques de su coche que dice 'Me gusta mi bandera'.", 
        color: "from-red-700 to-gray-800", icon: "🚩" 
    },
    { 
        id: 3, type: 'zombies', name: "Zombi Caracono", toughness: "Media", speed: "Básico", 
        desc: "Mecánica: Su cono de tráfico le proporciona el doble de resistencia que un zombi normal.", 
        description: "Camina como un zombi normal, pero con un cono de tráfico en la cabeza. ¿Por qué? Nadie lo sabe, pero le da un estilo 'urbano' y mucha protección.", 
        color: "from-orange-400 to-orange-600", icon: "⚠️" 
    },
    { 
        id: 4, type: 'zombies', name: "Saltador de Pértiga", toughness: "Media", speed: "Rápido", 
        desc: "Mecánica: Corre rápido con su pértiga y salta la primera planta que encuentra. Luego camina lento.", 
        description: "Un antiguo atleta olímpico... o tal vez solo un tipo que encontró un palo largo. Corre rápido y salta tu primera defensa con gracia (y hambre).", 
        color: "from-red-500 to-red-700", icon: "🏃" 
    },
    { 
        id: 5, type: 'zombies', name: "Zombi Caracubo", toughness: "Alta", speed: "Básico", 
        desc: "Mecánica: El cubo le da una resistencia extrema (5 veces la de un zombi normal). Usa Magnetoseta.", 
        description: "El cubo metálico que lleva puesto era originalmente para pintar su casa, pero ahora sirve como un casco casi impenetrable. Es el terror de los lanzaguisantes.", 
        color: "from-gray-400 to-slate-600", icon: "🪣" 
    },
    { 
        id: 6, type: 'zombies', name: "Zombi Lector", toughness: "Media", speed: "Variable", 
        desc: "Mecánica: Su periódico actúa como escudo. Si lo rompes, entra en frenesí y corre muy rápido.", 
        description: "Solo quiere terminar su sudoku y leer las noticias en paz. Si destruyes su periódico (su escudo), entrará en una furia ciega y correrá hacia tu casa.", 
        color: "from-gray-800 to-black", icon: "📰" 
    },
    { 
        id: 7, type: 'zombies', name: "Zombi Portero", toughness: "Alta", speed: "Básico", 
        desc: "Mecánica: Su puerta bloquea los guisantes normales y esporas. Usa catapultas o Humosetas.", 
        description: "Literalmente arrancó la puerta mosquitera de una casa para usarla como escudo. Los guisantes rebotan en la rejilla a menos que uses plantas perforantes.", 
        color: "from-blue-700 to-slate-800", icon: "🚪" 
    },
    { 
        id: 8, type: 'zombies', name: "Zombi Deportista", toughness: "Muy Alta", speed: "Muy Rápido", 
        desc: "Mecánica: Corre extremadamente rápido hacia tu casa. Tiene mucha salud gracias a su equipo.", 
        description: "El Zombi Deportista da el 110 por ciento en el campo. Es un jugador de equipo, aunque no sepa qué es un balón.", 
        color: "from-red-600 to-black", icon: "🏈" 
    },
    { 
        id: 9, type: 'zombies', name: "Zombi Bailón", toughness: "Media", speed: "Básico", 
        desc: "Mecánica: Invoca periódicamente a cuatro Zombis Extra (Bailarines de respaldo) en formación.", 
        description: "Cualquier parecido con personas vivas o muertas es pura coincidencia. Le gusta invocar a cuatro bailarines de respaldo para crear formaciones.", 
        color: "from-pink-600 to-purple-800", icon: "🕺" 
    },
    { 
        id: 10, type: 'zombies', name: "Zombi Extra", toughness: "Baja", speed: "Básico", 
        desc: "Mecánica: Aparecen en grupos de cuatro alrededor del Zombi Bailón. Si mueren, el Bailón invoca más.", 
        description: "Estos zombis han pasado años en la escuela de artes escénicas de zombis esperando su gran oportunidad.", 
        color: "from-pink-400 to-red-400", icon: "👯" 
    },
    { 
        id: 11, type: 'zombies', name: "Zombi Playero", toughness: "Baja", speed: "Básico", 
        desc: "Mecánica: Es un zombi normal con un flotador de patito. Solo aparece en el agua.", 
        description: "Su flotador de patito le permite flotar en el agua. Aunque no lo admita, le tiene miedo a los tiburones.", 
        color: "from-yellow-400 to-green-500", icon: "🦆" 
    },
    { 
        id: 12, type: 'zombies', name: "Zombi Buzo", toughness: "Baja", speed: "Básico", 
        desc: "Mecánica: Bucea bajo el agua para evitar disparos. Solo emerge para comer plantas.", 
        description: "No es que le guste bucear, es que odia que le disparen guisantes en la cara. Es una cuestión de practicidad.", 
        color: "from-blue-500 to-cyan-700", icon: "🤿" 
    },
    { 
        id: 13, type: 'zombies', name: "Zomboni", toughness: "Alta", speed: "Básico", 
        desc: "Mecánica: Conduce una pulidora que aplasta plantas y deja un rastro de hielo invulnerable.", 
        description: "A menudo confunden al Zomboni con un zombi conductor de Zamboni. Pero él es una forma de vida totalmente diferente.", 
        color: "from-blue-600 to-gray-400", icon: "🚜" 
    },
    { 
        id: 14, type: 'zombies', name: "Zombi de Trineo", toughness: "Media", speed: "Básico", 
        desc: "Mecánica: Aparecen en grupos de cuatro sobre el hielo dejado por el Zomboni.", 
        description: "Trabajan en equipo. O eso dicen. En realidad solo se pelean por quién conduce el trineo.", 
        color: "from-red-500 to-blue-300", icon: "🛷" 
    },
    { 
        id: 15, type: 'zombies', name: "Zombi con Delfín", toughness: "Media", speed: "Muy Rápido", 
        desc: "Mecánica: Muy rápido en el agua. Salta la primera planta acuática que encuentra con su delfín.", 
        description: "El delfín también es un zombi. No preguntes cómo funciona eso. Es complicado.", 
        color: "from-gray-400 to-teal-500", icon: "🐬" 
    },
    { 
        id: 16, type: 'zombies', name: "Zombi con Cajita", toughness: "Media", speed: "Rápido", 
        desc: "Mecánica: Se mueve rápido y, tras un tiempo aleatorio, explota destruyendo plantas cercanas.", 
        description: "¡Sorpresa! Este zombi tiene una risa maníaca y una caja explosiva. No dejes que se acerque.", 
        color: "from-purple-500 to-black", icon: "🎁" 
    },
    { 
        id: 17, type: 'zombies', name: "Zombi con Globo", toughness: "Baja", speed: "Rápido", 
        desc: "Mecánica: Vuela sobre todas las defensas. Inmune a la mayoría de ataques salvo Cactus y Trebolador.", 
        description: "Flota por el aire, sin importarle nada. Hasta que alguien pincha su globo. Entonces le importa mucho.", 
        color: "from-red-500 to-pink-500", icon: "🎈" 
    },
    { 
        id: 18, type: 'zombies', name: "Zombi Minero", toughness: "Media", speed: "Básico", 
        desc: "Mecánica: Excava bajo tierra hasta el final del jardín y luego ataca las plantas desde atrás.", 
        description: "Se pasa el día cavando. Espera encontrar oro, o cerebros. Preferiblemente cerebros.", 
        color: "from-yellow-600 to-brown-700", icon: "⛏️" 
    },
    { 
        id: 19, type: 'zombies', name: "Zombi Saltarín", toughness: "Media", speed: "Rápido", 
        desc: "Mecánica: Salta sobre todas tus plantas con su pogo. Usa Magnetoseta para quitarle el pogo.", 
        description: "¡Boing! ¡Boing! Le encanta el sonido que hace su pogo. A tus plantas no les hace tanta gracia.", 
        color: "from-green-400 to-blue-500", icon: "🤸" 
    },
    { 
        id: 20, type: 'zombies', name: "Zombi Yeti", toughness: "Alta", speed: "Básico", 
        desc: "Mecánica: Zombi raro que aparece en niveles avanzados. Se va si no lo matas rápido. Da diamantes.", 
        description: "Nadie cree en su existencia. Él prefiere mantenerlo así. Es muy tímido.", 
        color: "from-white to-blue-200", icon: "❄️" 
    },
    { 
        id: 21, type: 'zombies', name: "Zombi Colgao", toughness: "Media", speed: "Vuelo", 
        desc: "Mecánica: Cae del cielo, roba una planta y se va volando. Usa Paraplanta para detenerlo.", 
        description: "Le gusta colgarse por ahí. Literalmente. Espera el momento perfecto para robarte esa Melonpulta.", 
        color: "from-gray-400 to-slate-500", icon: "🪢" 
    },
    { 
        id: 22, type: 'zombies', name: "Zombi con Escalera", toughness: "Media", speed: "Rápido", 
        desc: "Mecánica: Coloca una escalera sobre Nueces o Calabazas, permitiendo que otros zombis pasen por encima.", 
        description: "Compró la escalera en oferta. Ahora la usa para invadir jardines. Es un zombi muy práctico.", 
        color: "from-yellow-700 to-orange-800", icon: "🪜" 
    },
    { 
        id: 23, type: 'zombies', name: "Zombi Catapulta", toughness: "Media", speed: "Básico", 
        desc: "Mecánica: Conduce un vehículo y lanza pelotas de baloncesto a tus plantas traseras. Aplasta plantas.", 
        description: "Le gusta el baloncesto. Y aplastar cosas. Combina sus dos pasiones en este vehículo mortal.", 
        color: "from-red-700 to-gray-900", icon: "🏀" 
    },
    { 
        id: 24, type: 'zombies', name: "Zombistein", toughness: "Extrema", speed: "Lento", 
        desc: "Mecánica: Gigante con salud masiva. Aplasta plantas de un golpe con su poste. Lanza al Zombidito.", 
        description: "También conocido como Gargantúa. Es gigantesco, tiene muy mal genio y lleva a un pequeño Zombidito en su espalda para lanzarlo cuando está en apuros.", 
        color: "from-purple-900 to-slate-900", icon: "👹" 
    },
    { 
        id: 25, type: 'zombies', name: "Zombidito", toughness: "Baja", speed: "Rápido", 
        desc: "Mecánica: Pequeño y frágil, pero es lanzado profundo en tus defensas por el Zombistein.", 
        description: "Es pequeño, pero matón. Le gusta volar por los aires y aterrizar sobre tus girasoles.", 
        color: "from-purple-400 to-pink-400", icon: "👶" 
    },
    { 
        id: 26, type: 'zombies', name: "Dr. Zomboss", toughness: "Infinita", speed: "N/A", 
        desc: "Mecánica: El jefe final. Controla el Zombot, lanza bolas de fuego y hielo, y aplasta todo con furgonetas.", 
        description: "Edgar Zomboss. Tiene un doctorado en Tanatología. Es el cerebro detrás de toda la invasión zombi.", 
        color: "from-gray-800 to-red-900", icon: "🤖" 
    },
];

// --- MAIN APP COMPONENT ---
export default function App() {
    const [authOpen, setAuthOpen] = useState(false);
    const [user, setUser] = useState(null); // { uid, name }
    const [almanacOpen, setAlmanacOpen] = useState(false);
    const [almanacType, setAlmanacType] = useState('plants'); // plants or zombies
    const [selectedItem, setSelectedItem] = useState(null);
    const [favoritesOpen, setFavoritesOpen] = useState(false); // Favorites modal state
    const [toast, setToast] = useState(null); // { message, type }

    // Helper to show toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- AUTH LISTENER ---
    useEffect(() => {
        // Removed anonymous sign-in from here. 
        // User starts as null (not logged in) by default.
        
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // If we have a user (logged in), fetch their profile
                const profileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info');
                onSnapshot(profileRef, (snap) => {
                    if (snap.exists()) {
                        setUser({ 
                            uid: currentUser.uid, 
                            name: snap.data().name, 
                            isAnonymous: currentUser.isAnonymous 
                        });
                    } else {
                        // Fallback if profile doc doesn't exist
                        setUser({ 
                            uid: currentUser.uid, 
                            name: currentUser.displayName || currentUser.email || "Jardinero",
                            isAnonymous: currentUser.isAnonymous
                        });
                    }
                }, (error) => {
                    console.log("Profile error:", error);
                });
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- SCROLL LOCK ---
    useEffect(() => {
        if (authOpen || almanacOpen || favoritesOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [authOpen, almanacOpen, favoritesOpen]);

    const handleOpenItem = (type, item) => {
        setAlmanacType(type);
        setSelectedItem(item);
        setAlmanacOpen(true);
        setFavoritesOpen(false); // Close favorites if open
    };

    const handleSignOut = () => {
        signOut(auth);
        showToast("Has cerrado sesión", "info");
    };

    return (
        <div className="bg-[#0f172a] min-h-screen text-slate-300 font-sans selection:bg-green-500/30 overflow-x-hidden">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Roboto+Slab:wght@300;400;700&display=swap');
                .font-creepster { font-family: 'Creepster', cursive; }
                .font-roboto { font-family: 'Roboto Slab', serif; }
                /* Custom Scrollbar for comments */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(120, 53, 15, 0.3); border-radius: 10px; }
            `}</style>

            <Navbar 
                user={user} 
                onAuthClick={() => setAuthOpen(true)} 
                onOpenAlmanac={(type) => {
                    setAlmanacType(type);
                    setSelectedItem(null);
                    setAlmanacOpen(true);
                }}
                onSelectSearchResult={(item) => handleOpenItem(item.type, item)}
                onOpenFavorites={() => setFavoritesOpen(true)}
            />

            <HeroSectionOne 
                onExplore={() => {
                    const section = document.getElementById('almanaque');
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
            />

            <AlmanacPreview 
                onOpen={(type) => {
                    setAlmanacType(type);
                    setSelectedItem(null);
                    setAlmanacOpen(true);
                }}
            />

            <ModesSection />

            <ResourcesSection />
            
            <Footer />

            {/* TOAST NOTIFICATION */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-2xl z-[200] font-bold text-white ${toast.type === 'error' ? 'bg-red-600' : (toast.type === 'info' ? 'bg-blue-600' : 'bg-green-600')}`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
            <AnimatePresence>
                {authOpen && (
                    <AuthModal 
                        onClose={() => setAuthOpen(false)} 
                        user={user}
                        onSignOut={handleSignOut}
                        showToast={showToast}
                    />
                )}
                {almanacOpen && (
                    <AlmanacModal 
                        type={almanacType}
                        selectedItem={selectedItem}
                        onClose={() => setAlmanacOpen(false)}
                        onSelect={(item) => setSelectedItem(item)}
                        onBack={() => setSelectedItem(null)}
                        user={user}
                        onLoginRequest={() => {
                            setAlmanacOpen(false);
                            setAuthOpen(true);
                        }}
                        showToast={showToast}
                    />
                )}
                {favoritesOpen && (
                    <FavoritesModal 
                        user={user}
                        onClose={() => setFavoritesOpen(false)}
                        onOpenItem={handleOpenItem}
                        onLoginRequest={() => {
                            setFavoritesOpen(false);
                            setAuthOpen(true);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- COMPONENTS ---

const Navbar = ({ user, onAuthClick, onOpenAlmanac, onSelectSearchResult, onOpenFavorites }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setSearchResults([]);
            return;
        }
        const all = [...plantsDB, ...zombiesDB];
        const results = all.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        setSearchResults(results);
    }, [searchQuery]);

    return (
        <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-4">
                    <div className="flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-green-400 transition">
                            <span className="text-xl">🍃</span>
                        </div>
                        <h1 className="text-2xl font-creepster text-white tracking-widest group-hover:text-green-400 transition hidden sm:inline">
                            PvZ<span className="text-green-500">Wiki</span>
                        </h1>
                    </div>

                    <div className="flex-1 flex justify-center max-w-lg relative">
                        <div className="relative w-full">
                            <input 
                                type="text" 
                                placeholder="Buscar Planta o Zombi..." 
                                className="w-full bg-white/10 border border-white/20 rounded-full py-2 px-10 text-white focus:border-green-500 focus:bg-white/20 outline-none transition"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                            
                            {searchResults.length > 0 && (
                                <div className="absolute top-full mt-2 left-0 w-full bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                    {searchResults.map(item => (
                                        <div 
                                            key={`${item.type}-${item.id}`} 
                                            className="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                                            onClick={() => {
                                                onSelectSearchResult(item);
                                                setSearchQuery("");
                                            }}
                                        >
                                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{item.name}</div>
                                                <div className="text-xs uppercase text-gray-400">{item.type}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {user?.name && !user.isAnonymous && (
                            <button 
                                onClick={onOpenFavorites} 
                                className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10"
                                title="Mis Favoritos"
                            >
                                <span className="text-lg">❤️</span>
                            </button>
                        )}

                        <button onClick={onAuthClick} className={`flex items-center gap-2 transition px-3 py-1.5 rounded-full border ${user?.name && !user.isAnonymous ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-white/20 text-gray-300 hover:text-white hover:bg-white/10'}`}>
                            {user && !user.isAnonymous ? (
                                <><span>🧟‍♂️</span><span className="text-xs font-bold">{user.name}</span></>
                            ) : (
                                <><span>👤</span><span className="text-xs font-bold">Acceder</span></>
                            )}
                        </button>
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">☰</button>
                    </div>
                </div>
            </div>
            
            {menuOpen && (
                <div className="md:hidden bg-black/95 border-b border-white/10 p-4 space-y-4">
                     {user?.name && !user.isAnonymous && (
                        <button onClick={() => { onOpenFavorites(); setMenuOpen(false); }} className="w-full text-left text-red-400 font-bold flex items-center gap-2">
                            <span>❤️</span> Mis Favoritos
                        </button>
                     )}
                     <button onClick={onAuthClick} className="w-full text-left text-green-400 font-bold">
                        {user && !user.isAnonymous ? `Perfil de ${user.name}` : 'Iniciar Sesión'}
                    </button>
                </div>
            )}
        </nav>
    );
};

// ... (HeroSectionOne, AlmanacPreview, Card, ModesSection, ResourcesSection, Footer) ...
function HeroSectionOne({ onExplore }) {
  return (
    <div className="relative mx-auto pt-20 pb-10 flex max-w-7xl flex-col items-center justify-center overflow-hidden">
      {/* Visual background elements */}
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/10"><div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-green-500 to-transparent animate-pulse" /></div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/10"><div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-green-500 to-transparent animate-pulse" /></div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/10"><div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" /></div>

      <div className="px-4 py-10 md:py-20 text-center relative z-10">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-4xl font-bold font-creepster text-white md:text-6xl lg:text-8xl drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
          {"Protege tu cerebro ahora, no mañana".split(" ").map((word, index) => (
              <motion.span key={index} initial={{ opacity: 0, filter: "blur(4px)", y: 10 }} animate={{ opacity: 1, filter: "blur(0px)", y: 0 }} transition={{ duration: 0.3, delay: index * 0.1, ease: "easeInOut" }} className="mr-3 inline-block bg-clip-text text-transparent bg-gradient-to-b from-green-300 to-green-600">
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.8 }} className="relative z-10 mx-auto max-w-xl py-6 text-center text-lg font-normal text-gray-400">
          Con nuestra Wiki, dominarás el arte de la jardinería defensiva en minutos. Descubre las estadísticas ocultas, estrategias y secretos de cada planta y zombi.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 1 }} className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
          <button onClick={onExplore} className="w-60 transform rounded-xl bg-green-600 px-6 py-3 font-bold text-black transition-all duration-300 hover:-translate-y-1 hover:bg-green-500 shadow-[0_0_20px_rgba(74,222,128,0.3)]">Explorar el Jardín</button>
          <button onClick={() => document.getElementById('modos').scrollIntoView({ behavior: 'smooth' })} className="w-60 transform rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10">Ver Modos de Juego</button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 1.2 }} className="relative z-10 mt-20 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
          <div className="w-full overflow-hidden rounded-xl border border-white/10 relative h-[300px] md:h-[500px] bg-[#2a3c24]">
            <div className="absolute inset-0 bg-[radial-gradient(#3f5836_1px,transparent_1px)] bg-[length:20px_20px]"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-9xl mb-4 animate-bounce">🧟</div>
                <div className="text-6xl absolute -left-20 top-10">🌱</div>
                <div className="text-6xl absolute -right-20 top-10">🌻</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AlmanacPreview({ onOpen }) {
    return (
        <section id="almanaque" className="py-20 px-4 max-w-7xl mx-auto scroll-mt-24">
            <div className="text-center mb-16">
                <h2 className="text-5xl font-creepster text-white mb-4">El Almanaque</h2>
                <div className="h-1 w-24 bg-gradient-to-r from-green-500 to-purple-500 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                <Card title="Defensores" subtitle="49 especies de plantas listas para la batalla." color="green" icon="🌱" onClick={() => onOpen('plants')} />
                <Card title="Invasores" subtitle="26 tipos de no-muertos hambrientos." color="purple" icon="🧟" onClick={() => onOpen('zombies')} />
            </div>
        </section>
    )
}

function Card({ title, subtitle, color, icon, onClick }) {
    const isGreen = color === 'green';
    const bgClass = isGreen ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' : 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20';
    const textClass = isGreen ? 'text-green-400' : 'text-purple-400';
    return (
        <motion.div whileHover={{ y: -5 }} className={`p-8 rounded-3xl border ${bgClass} backdrop-blur-sm cursor-pointer transition-all duration-300 flex items-start gap-6`} onClick={onClick}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${isGreen ? 'bg-green-500/20' : 'bg-purple-500/20'}`}> {icon} </div>
            <div>
                <h3 className={`text-3xl font-creepster mb-2 ${textClass}`}>{title}</h3>
                <p className="text-gray-400 mb-4">{subtitle}</p>
                <div className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${textClass}`}> Abrir Base de Datos <span>→</span> </div>
            </div>
        </motion.div>
    )
}

function ModesSection() {
    const modesData = [
        { id: "day", name: "Día", icon: "☀️", levels: "Niveles 1-1 a 1-10", zombies: "Zombi, Abanderado, Caracono, Saltador de Pértiga, Caracubo.", tip: "El sol cae del cielo. Planta al menos 2 filas de Girasoles para tener una economía sólida.", color: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40" },
        { id: "night", name: "Noche", icon: "🌙", levels: "Niveles 2-1 a 2-10", zombies: "Lector, Portero, Deportista, Bailón, Setas.", tip: "No cae sol del cielo. Las setas son más baratas pero duermen de día. ¡Usa Seta Desesporada (gratis)!", color: "bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40" },
        { id: "pool", name: "Piscina", icon: "🌊", levels: "Niveles 3-1 a 3-10", zombies: "Playero, Buzo, Zomboni, Trineo, Delfín.", tip: "6 líneas en total. Necesitas Nenúfares para plantar en el agua. Zampalga es muy útil aquí.", color: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40" },
        { id: "fog", name: "Niebla", icon: "🌫️", levels: "Niveles 4-1 a 4-10", zombies: "Globo, Minero, Saltador, Cajita.", tip: "Visibilidad reducida. Usa Planterna para ver o Trebolador para limpiar la niebla y los globos.", color: "bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20 hover:border-gray-500/40" },
        { id: "roof", name: "Tejado", icon: "🏠", levels: "Niveles 5-1 a 5-10", zombies: "Colgao, Escalera, Catapulta, Zombistein, Dr. Zomboss.", tip: "El suelo inclinado bloquea disparos rectos. Usa plantas catapulta (Coltapulta, Lanzamaíz). Necesitas Macetas.", color: "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40" }
    ];
    const [expandedMode, setExpandedMode] = useState(null);
    return (
        <section id="modos" className="py-24 px-4 max-w-7xl mx-auto relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-green-500/5 blur-[100px] rounded-full pointer-events-none" />
             <div className="flex flex-col md:flex-row justify-between items-end mb-12 relative z-10">
                <div> <h2 className="text-5xl font-creepster text-white drop-shadow-lg">Modo Aventura</h2> <p className="text-gray-400 mt-3 text-lg font-light">Explora los 5 escenarios únicos del jardín.</p> </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                {modesData.map((mode) => (
                    <motion.div layout key={mode.id} onClick={() => setExpandedMode(expandedMode === mode.id ? null : mode.id)} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }} className={`p-6 rounded-3xl border cursor-pointer relative overflow-hidden backdrop-blur-md shadow-xl ${mode.color} ${expandedMode === mode.id ? 'col-span-1 md:col-span-2 lg:col-span-5 ring-2 ring-white/10' : 'hover:scale-[1.02]'}`}>
                        <motion.div layout="position" className="flex flex-col items-center text-center">
                            <span className="text-6xl mb-4 filter drop-shadow-lg">{mode.icon}</span>
                            <h4 className="font-bold text-white text-2xl mb-1 font-creepster tracking-wide">{mode.name}</h4>
                            {!expandedMode && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2"> <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold border border-white/10 px-3 py-1 rounded-full bg-black/20"> Ver Info </span> </motion.div> )}
                        </motion.div>
                        <AnimatePresence mode="wait">
                            {expandedMode === mode.id && (
                                <motion.div initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.3, delay: 0.1 }} className="mt-8 pt-6 border-t border-white/10">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-black/20 p-5 rounded-2xl border border-white/5"> <h5 className="text-green-400 font-bold mb-2 uppercase tracking-widest text-xs flex items-center gap-2"> <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div> Rango </h5> <p className="text-white font-bold text-lg">{mode.levels}</p> </div>
                                        <div className="bg-black/20 p-5 rounded-2xl border border-white/5"> <h5 className="text-purple-400 font-bold mb-2 uppercase tracking-widest text-xs flex items-center gap-2"> <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]"></div> Amenazas </h5> <p className="text-gray-300 text-sm leading-relaxed">{mode.zombies}</p> </div>
                                        <div className="bg-yellow-500/10 p-5 rounded-2xl border border-yellow-500/20"> <h5 className="text-yellow-400 font-bold mb-2 uppercase tracking-widest text-xs flex items-center gap-2"> <i className="fa-solid fa-lightbulb"></i> Pro Tip </h5> <p className="text-yellow-100/90 text-sm italic">"{mode.tip}"</p> </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

function ResourcesSection() {
    return (
        <section id="recursos" className="py-12 text-center">
            <h3 className="text-2xl text-gray-500 font-creepster mb-8">Enlaces Externos</h3>
            <div className="flex justify-center gap-6 flex-wrap">
                <a href="https://www.ea.com/es-es/games/plants-vs-zombies/plants-vs-zombies" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 hover:border-blue-500 hover:text-blue-400 transition text-sm font-bold text-gray-400">
                    Juego en EA
                </a>
                <a href="https://www.youtube.com/@PlantsVsZombies" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 hover:border-red-500 hover:text-red-400 transition text-sm font-bold text-gray-400">
                    Canal de YT Oficial de PvZ
                </a>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black/50 py-8 text-center text-gray-600 text-sm"> <p>Plants vs. Zombies &copy; 2009 Electronic Arts. Fan Wiki Rebuilt in React.</p> </footer>
    )
}

function AuthModal({ onClose, user, onSignOut, showToast }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for registration
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isRegistering) {
                // Register logic
                if (!name.trim()) throw new Error("Por favor ingresa un nombre");
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Save extra profile info in Firestore
                await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'info'), {
                    name: name.trim(),
                    email: email,
                    createdAt: serverTimestamp()
                });
                showToast(`¡Bienvenido, ${name.trim()}!`);
            } else {
                // Login logic
                await signInWithEmailAndPassword(auth, email, password);
                showToast("¡Has vuelto al jardín!");
            }
            onClose();
        } catch (err) {
            console.error("Auth error:", err);
            // Translate common firebase errors
            if (err.code === 'auth/email-already-in-use') setError("Este correo ya está registrado.");
            else if (err.code === 'auth/wrong-password') setError("Contraseña incorrecta.");
            else if (err.code === 'auth/user-not-found') setError("Usuario no encontrado.");
            else if (err.code === 'auth/invalid-credential') setError("Contraseña incorrecta."); // Simplified message
            else if (err.code === 'auth/weak-password') setError("La contraseña debe tener al menos 6 caracteres.");
            else setError(err.message || "Error al autenticar");
        } finally {
            setLoading(false);
        }
    };

    if (user?.name) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-md relative shadow-2xl text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                    <h2 className="text-3xl font-creepster text-green-400 mb-4">Bienvenido de nuevo</h2>
                    <p className="text-xl text-white mb-6">Hola, <span className="font-bold text-green-400">{user.name}</span></p>
                    
                    <div className="bg-white/5 p-4 rounded-xl text-left mb-6">
                        <p className="text-sm text-gray-400 mb-2">Estado de cuenta:</p>
                        <div className="flex items-center gap-2 text-green-400 font-bold">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Sesión Activa
                        </div>
                    </div>

                    <button onClick={onSignOut} className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/50 font-bold py-2 rounded transition mb-3">
                        Cerrar Sesión
                    </button>
                    <button onClick={onClose} className="text-sm text-gray-400 hover:text-white underline">Volver al Jardín</button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1e293b] border border-white/10 rounded-2xl p-8 w-full max-w-md relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
                <h2 className="text-3xl font-creepster text-green-400 mb-2 text-center">
                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>
                <p className="text-gray-400 text-center text-xs mb-6">Guarda tus favoritos y comenta.</p>
                
                <form onSubmit={handleAuthAction} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Nombre de Jardinero</label>
                            <input 
                                type="text" 
                                required={isRegistering}
                                className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm text-white focus:border-green-500 outline-none" 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Ej: Dave el Loco" 
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm text-white focus:border-green-500 outline-none" 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="tucorreo@ejemplo.com" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
                        <input 
                            type="password" 
                            required 
                            className="w-full bg-black/50 border border-gray-600 rounded p-2 text-sm text-white focus:border-green-500 outline-none" 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="******" 
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                    <button disabled={loading} type="submit" className="w-full font-bold py-2 rounded transition mt-2 bg-green-600 hover:bg-green-500 text-black">
                        {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Entrar')}
                    </button>
                </form>

                <div className="mt-4 text-center text-xs text-gray-400">
                    {isRegistering ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
                    <button 
                        type="button" 
                        onClick={() => { setIsRegistering(!isRegistering); setError(null); }} 
                        className="text-green-400 hover:underline font-bold"
                    >
                        {isRegistering ? "Inicia Sesión" : "Regístrate"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function FavoritesModal({ user, onClose, onOpenItem }) {
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (!user) {
            setFavorites([]);
            return;
        }

        const q = collection(db, 'artifacts', appId, 'users', user.uid, 'favorites');
        const unsub = onSnapshot(q, (snapshot) => {
            const favDocs = snapshot.docs.map(d => d.data());
            
            const mappedFavorites = favDocs.map(fav => {
                const dbSource = fav.type === 'plants' ? plantsDB : zombiesDB;
                const item = dbSource.find(i => i.id === fav.itemId);
                return item ? { ...item, type: fav.type } : null;
            }).filter(item => item !== null);

            setFavorites(mappedFavorites);
        }, (error) => {
            console.log("Error fetching favorites:", error);
        });

        return () => unsub();
    }, [user]);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20 text-xl">✕</button>
                
                <div className="p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-3xl font-creepster text-white flex items-center gap-3">
                        <span className="text-red-500">❤️</span> Mis Favoritos
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Tu colección personal de plantas y zombis.</p>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-[#0f172a]">
                    {favorites.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center">
                            <span className="text-6xl mb-4 opacity-30">🥀</span>
                            <p className="text-gray-400 text-lg">Aún no tienes favoritos.</p>
                            <button onClick={onClose} className="mt-4 text-green-400 hover:underline">Ir al Almanaque para añadir</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {favorites.map((item) => (
                                <motion.div 
                                    key={`${item.type}-${item.id}`}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => onOpenItem(item.type, item)}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 text-center cursor-pointer hover:bg-white/10 transition shadow-lg flex flex-col items-center relative overflow-hidden group"
                                >
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition duration-300 bg-gradient-to-br ${item.color}`}></div>
                                    <div className={`w-14 h-14 rounded-full mb-3 flex items-center justify-center text-3xl shadow-lg bg-gradient-to-br ${item.color} text-white z-10`}>
                                        {item.icon}
                                    </div>
                                    <div className="text-xs font-bold text-white z-10 w-full truncate">{item.name}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1 z-10">{item.type === 'plants' ? 'Planta' : 'Zombi'}</div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

function AlmanacModal({ type, selectedItem, onClose, onSelect, onBack, user, onLoginRequest, showToast }) {
    // ... (rest of AlmanacModal same as before) ...
    const data = type === 'plants' ? plantsDB : zombiesDB;
    const title = type === 'plants' ? 'Plantas' : 'Zombis';
    
    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        if (selectedItem && user) {
            const favRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', `${type}-${selectedItem.id}`);
            const unsub = onSnapshot(favRef, (snap) => {
                setIsFav(snap.exists());
            });
            return () => unsub();
        } else {
            setIsFav(false);
        }
    }, [selectedItem, user, type]);

    const toggleFavorite = async () => {
        if (!user) { onLoginRequest(); return; }
        const favRef = doc(db, 'artifacts', appId, 'users', user.uid, 'favorites', `${type}-${selectedItem.id}`);
        if (isFav) {
            await deleteDoc(favRef);
            showToast("Eliminado de favoritos", "info");
        } else {
            await setDoc(favRef, { itemId: selectedItem.id, type, timestamp: serverTimestamp() });
            showToast("¡Añadido a favoritos!");
        }
    };

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (!selectedItem) {
            setComments([]);
            return;
        }
        
        // ALWAYS fetch comments, even if user is null
        // We use a try-catch or assume Firestore rules allow public read
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'comments');
        
        // Note: In real app with strict rules, this might fail if rules require auth.
        // But for this "open wiki" style, public read is standard.
        const unsub = onSnapshot(q, (snapshot) => {
            const allComments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = allComments
                .filter(c => c.itemId === selectedItem.id && c.type === type)
                .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setComments(filtered);
        }, (error) => {
                console.log("Comments read error (likely permission):", error);
        });
        return () => unsub();
    }, [selectedItem, type]); // removed 'user' dependency so it runs on load

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!user) { onLoginRequest(); return; }
        if (!newComment.trim()) return;

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), {
            itemId: selectedItem.id,
            type,
            text: newComment.trim(),
            userName: user.name,
            userId: user.uid,
            timestamp: serverTimestamp()
        });
        setNewComment("");
        showToast("Comentario publicado");
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[#fef3c7] text-[#3E1D04] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-4 border-[#3E1D04] shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{ backgroundImage: 'radial-gradient(#d4c4a8 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <div className="bg-[#5D2906] text-yellow-400 px-6 py-4 flex justify-between items-center border-b-4 border-[#3E1D04] flex-shrink-0">
                    <h2 className={`text-3xl font-creepster tracking-wider`}>Almanaque: {title}</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 font-bold shadow-lg">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!selectedItem ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {data.map(item => (
                                <motion.div key={item.id} whileHover={{ scale: 1.05 }} onClick={() => onSelect(item)} className="bg-white/50 border-2 border-[#78350f] rounded-lg p-3 text-center cursor-pointer hover:bg-white transition shadow-sm flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center text-2xl shadow-inner bg-gradient-to-br ${item.color} text-white`}> {item.icon} </div>
                                    <div className="text-xs font-bold truncate w-full">{item.name}</div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={onBack} className="text-sm text-blue-800 hover:underline font-bold self-start">← Volver a la lista</button>
                                <button onClick={toggleFavorite} className={`px-4 py-1 rounded-full text-sm font-bold border-2 transition flex items-center gap-2 ${isFav ? 'bg-red-500 text-white border-red-600' : 'bg-white border-red-500 text-red-500'}`}>
                                    {isFav ? '❤️ Favorito' : '🤍 Añadir a favs'}
                                </button>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8 bg-white border-2 border-[#78350f] p-6 rounded-lg shadow-inner mb-6">
                                <div className="flex flex-col items-center min-w-[150px]">
                                    <div className={`w-32 h-32 rounded-xl flex items-center justify-center text-7xl shadow-lg border-4 border-white mb-4 bg-gradient-to-br ${selectedItem.color} text-white`}> {selectedItem.icon} </div>
                                    <h3 className="text-2xl font-bold text-center leading-tight font-creepster">{selectedItem.name}</h3>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="p-4 bg-[#fdf6e3] rounded border border-[#d4c4a8] italic text-sm leading-relaxed"> {selectedItem.history || selectedItem.description} </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {type === 'plants' ? (
                                            <>
                                                <div className="bg-yellow-100 p-2 rounded border border-yellow-300">☀️ <strong>Coste:</strong> {selectedItem.cost}</div>
                                                <div className="bg-blue-100 p-2 rounded border border-blue-300">⏲ <strong>Recarga:</strong> {selectedItem.recharge}</div>
                                                <div className="bg-red-100 p-2 rounded border border-red-300 col-span-2">💥 <strong>Daño:</strong> {selectedItem.damage}</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-gray-200 p-2 rounded border border-gray-400">🛡️ <strong>Dureza:</strong> {selectedItem.toughness}</div>
                                                <div className="bg-red-100 p-2 rounded border border-red-300">🏃 <strong>Velocidad:</strong> {selectedItem.speed}</div>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-4 border-t border-gray-300 pt-2"> {selectedItem.desc} </div>
                                </div>
                            </div>

                            <div className="bg-white/50 border-t-2 border-[#78350f] pt-4">
                                <h4 className="font-bold text-[#3E1D04] mb-3 flex items-center gap-2">💬 Comentarios de Jardineros <span className="text-xs font-normal text-gray-600 bg-white px-2 rounded-full border border-gray-300">{comments.length}</span></h4>
                                
                                <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic text-center py-4">Sé el primero en comentar sobre {selectedItem.name}...</p>
                                    ) : (
                                        comments.map(c => (
                                            <div key={c.id} className="bg-white p-3 rounded-lg border border-[#d4c4a8] shadow-sm text-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-[#5D2906]">{c.userName}</span>
                                                    <span className="text-[10px] text-gray-400">{c.timestamp?.seconds ? new Date(c.timestamp.seconds * 1000).toLocaleDateString() : 'ahora'}</span>
                                                </div>
                                                <p className="text-gray-700">{c.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form onSubmit={handlePostComment} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder={user ? "Escribe tu opinión..." : "Inicia sesión para comentar"} 
                                        disabled={!user}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="flex-1 border border-[#78350f] rounded p-2 text-sm bg-white disabled:bg-gray-200"
                                    />
                                    <button type="submit" disabled={!user || !newComment.trim()} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold px-4 rounded text-sm transition">
                                        Enviar
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}