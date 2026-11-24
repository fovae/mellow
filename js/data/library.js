// Ready-made vocabulary. Loaded only when needed.
// Each line: English | Russian | Spanish | French | German | Italian.
// A line that starts with ">" is an example for the line above.
export const libraryLanguages = ["English", "Russian", "Spanish", "French", "German", "Italian"];

export const topics = [
{ id: "basics", emoji: "👋", level: "A1", title: { en: "First words", ru: "Первые слова" }, data: `
hello|привет|hola|salut|hallo|ciao
good morning|доброе утро|buenos días|bonjour|guten Morgen|buongiorno
good evening|добрый вечер|buenas tardes|bonsoir|guten Abend|buonasera
good night|спокойной ночи|buenas noches|bonne nuit|gute Nacht|buonanotte
goodbye|до свидания|adiós|au revoir|auf Wiedersehen|arrivederci
see you tomorrow|до завтра|hasta mañana|à demain|bis morgen|a domani
please|пожалуйста|por favor|s'il vous plaît|bitte|per favore
thank you|спасибо|gracias|merci|danke|grazie
you're welcome|не за что|de nada|de rien|gern geschehen|prego
yes|да|sí|oui|ja|sì
no|нет|no|non|nein|no
maybe|может быть|quizás|peut-être|vielleicht|forse
sorry|извините|lo siento|désolé|Entschuldigung|mi dispiace
of course|конечно|por supuesto|bien sûr|natürlich|certo
I|я|yo|je|ich|io
you (informal)|ты|tú|tu|du|tu
he|он|él|il|er|lui
she|она|ella|elle|sie (singular)|lei
we|мы|nosotros|nous|wir|noi
they|они|ellos|ils|sie (plural)|loro
here|здесь|aquí|ici|hier|qui
there|там|allí|là-bas|dort|lì
very|очень|muy|très|sehr|molto
a little|немного|un poco|un peu|ein bisschen|un po'
` },
{ id: "phrases", emoji: "💬", level: "A1", title: { en: "Everyday phrases", ru: "Фразы на каждый день" }, data: `
How are you?|Как дела?|¿Cómo estás?|Comment ça va ?|Wie geht's?|Come stai?
I'm fine, thanks.|Всё хорошо, спасибо.|Estoy bien, gracias.|Je vais bien, merci.|Mir geht's gut, danke.|Sto bene, grazie.
What's your name?|Как тебя зовут?|¿Cómo te llamas?|Comment tu t'appelles ?|Wie heißt du?|Come ti chiami?
My name is Anna.|Меня зовут Анна.|Me llamo Anna.|Je m'appelle Anna.|Ich heiße Anna.|Mi chiamo Anna.
Nice to meet you.|Приятно познакомиться.|Mucho gusto.|Enchanté.|Freut mich.|Piacere.
Where are you from?|Откуда ты?|¿De dónde eres?|Tu viens d'où ?|Woher kommst du?|Di dove sei?
I don't understand.|Я не понимаю.|No entiendo.|Je ne comprends pas.|Ich verstehe nicht.|Non capisco.
I don't know.|Я не знаю.|No lo sé.|Je ne sais pas.|Ich weiß nicht.|Non lo so.
Can you repeat that?|Можешь повторить?|¿Puedes repetirlo?|Tu peux répéter ?|Kannst du das wiederholen?|Puoi ripetere?
Speak more slowly, please.|Говорите медленнее, пожалуйста.|Hable más despacio, por favor.|Parlez plus lentement, s'il vous plaît.|Sprechen Sie bitte langsamer.|Parli più lentamente, per favore.
What does this mean?|Что это значит?|¿Qué significa esto?|Qu'est-ce que ça veut dire ?|Was bedeutet das?|Cosa significa?
I need help.|Мне нужна помощь.|Necesito ayuda.|J'ai besoin d'aide.|Ich brauche Hilfe.|Ho bisogno di aiuto.
No problem.|Без проблем.|No hay problema.|Pas de problème.|Kein Problem.|Nessun problema.
I like it.|Мне это нравится.|Me gusta.|Ça me plaît.|Das gefällt mir.|Mi piace.
I agree.|Я согласен.|Estoy de acuerdo.|Je suis d'accord.|Ich bin einverstanden.|Sono d'accordo.
Let's go!|Пойдём!|¡Vamos!|On y va !|Gehen wir!|Andiamo!
Wait a minute.|Подожди минуту.|Espera un minuto.|Attends une minute.|Warte eine Minute.|Aspetta un minuto.
I'm hungry.|Я хочу есть.|Tengo hambre.|J'ai faim.|Ich habe Hunger.|Ho fame.
I'm thirsty.|Я хочу пить.|Tengo sed.|J'ai soif.|Ich habe Durst.|Ho sete.
Good luck!|Удачи!|¡Buena suerte!|Bonne chance !|Viel Glück!|Buona fortuna!
Happy birthday!|С днём рождения!|¡Feliz cumpleaños!|Joyeux anniversaire !|Alles Gute zum Geburtstag!|Buon compleanno!
Enjoy your meal!|Приятного аппетита!|¡Buen provecho!|Bon appétit !|Guten Appetit!|Buon appetito!
` },
{ id: "numbers", emoji: "🔢", level: "A1", title: { en: "Numbers", ru: "Числа" }, data: `
zero|ноль|cero|zéro|null|zero
one|один|uno|un|eins|uno
two|два|dos|deux|zwei|due
three|три|tres|trois|drei|tre
four|четыре|cuatro|quatre|vier|quattro
five|пять|cinco|cinq|fünf|cinque
six|шесть|seis|six|sechs|sei
seven|семь|siete|sept|sieben|sette
eight|восемь|ocho|huit|acht|otto
nine|девять|nueve|neuf|neun|nove
ten|десять|diez|dix|zehn|dieci
eleven|одиннадцать|once|onze|elf|undici
twelve|двенадцать|doce|douze|zwölf|dodici
fifteen|пятнадцать|quince|quinze|fünfzehn|quindici
twenty|двадцать|veinte|vingt|zwanzig|venti
thirty|тридцать|treinta|trente|dreißig|trenta
forty|сорок|cuarenta|quarante|vierzig|quaranta
fifty|пятьдесят|cincuenta|cinquante|fünfzig|cinquanta
hundred|сто|cien|cent|hundert|cento
thousand|тысяча|mil|mille|tausend|mille
first|первый|primero|premier|erster|primo
second|второй|segundo|deuxième|zweiter|secondo
third|третий|tercero|troisième|dritter|terzo
half|половина|la mitad|la moitié|die Hälfte|la metà
` },
{ id: "time", emoji: "🕐", level: "A1", title: { en: "Time and days", ru: "Время и дни" }, data: `
today|сегодня|hoy|aujourd'hui|heute|oggi
tomorrow|завтра|mañana|demain|morgen|domani
yesterday|вчера|ayer|hier|gestern|ieri
now|сейчас|ahora|maintenant|jetzt|adesso
later|позже|más tarde|plus tard|später|più tardi
always|всегда|siempre|toujours|immer|sempre
never|никогда|nunca|jamais|nie|mai
often|часто|a menudo|souvent|oft|spesso
sometimes|иногда|a veces|parfois|manchmal|a volte
Monday|понедельник|el lunes|lundi|der Montag|il lunedì
Tuesday|вторник|el martes|mardi|der Dienstag|il martedì
Wednesday|среда|el miércoles|mercredi|der Mittwoch|il mercoledì
Thursday|четверг|el jueves|jeudi|der Donnerstag|il giovedì
Friday|пятница|el viernes|vendredi|der Freitag|il venerdì
Saturday|суббота|el sábado|samedi|der Samstag|il sabato
Sunday|воскресенье|el domingo|dimanche|der Sonntag|la domenica
the day|день|el día|le jour|der Tag|il giorno
the week|неделя|la semana|la semaine|die Woche|la settimana
the month|месяц|el mes|le mois|der Monat|il mese
the year|год|el año|l'année|das Jahr|l'anno
the hour|час|la hora|l'heure|die Stunde|l'ora
the minute|минута|el minuto|la minute|die Minute|il minuto
the evening|вечер|la tarde|le soir|der Abend|la sera
the night|ночь|la noche|la nuit|die Nacht|la notte
spring|весна|la primavera|le printemps|der Frühling|la primavera
summer|лето|el verano|l'été|der Sommer|l'estate
autumn|осень|el otoño|l'automne|der Herbst|l'autunno
winter|зима|el invierno|l'hiver|der Winter|l'inverno
` },
{ id: "questions", emoji: "❓", level: "A1", title: { en: "Questions and links", ru: "Вопросы и связки" }, data: `
who|кто|quién|qui|wer|chi
what|что|qué|quoi|was|cosa
where|где|dónde|où|wo|dove
when|когда|cuándo|quand|wann|quando
why|почему|por qué|pourquoi|warum|perché
how|как|cómo|comment|wie|come
how much|сколько|cuánto|combien|wie viel|quanto
which|какой|cuál|quel|welcher|quale
and|и|y|et|und|e
or|или|o|ou|oder|o
but|но|pero|mais|aber|ma
because|потому что|porque|parce que|weil|perché (because)
if|если|si|si|wenn|se
with|с|con|avec|mit|con
without|без|sin|sans|ohne|senza
for|для|para|pour|für|per
before|до|antes de|avant|vor|prima di
after|после|después de|après|nach|dopo
between|между|entre|entre|zwischen|tra
also|тоже|también|aussi|auch|anche
only|только|solo|seulement|nur|solo
already|уже|ya|déjà|schon|già
still|всё ещё|todavía|encore|noch|ancora
almost|почти|casi|presque|fast|quasi
` },
{ id: "people", emoji: "👨‍👩‍👧", level: "A1", title: { en: "Family and people", ru: "Семья и люди" }, data: `
the family|семья|la familia|la famille|die Familie|la famiglia
the mother|мать|la madre|la mère|die Mutter|la madre
the father|отец|el padre|le père|der Vater|il padre
the parents|родители|los padres|les parents|die Eltern|i genitori
the son|сын|el hijo|le fils|der Sohn|il figlio
the daughter|дочь|la hija|la fille (daughter)|die Tochter|la figlia
the brother|брат|el hermano|le frère|der Bruder|il fratello
the sister|сестра|la hermana|la sœur|die Schwester|la sorella
the grandmother|бабушка|la abuela|la grand-mère|die Großmutter|la nonna
the grandfather|дедушка|el abuelo|le grand-père|der Großvater|il nonno
the uncle|дядя|el tío|l'oncle|der Onkel|lo zio
the aunt|тётя|la tía|la tante|die Tante|la zia
the husband|муж|el marido|le mari|der Ehemann|il marito
the wife|жена|la esposa|la femme (wife)|die Ehefrau|la moglie
the child|ребёнок|el niño|l'enfant|das Kind|il bambino
the man|мужчина|el hombre|l'homme|der Mann|l'uomo
the woman|женщина|la mujer|la femme|die Frau|la donna
the boy|мальчик|el chico|le garçon|der Junge|il ragazzo
the girl|девочка|la chica|la fille|das Mädchen|la ragazza
the friend|друг|el amigo|l'ami|der Freund|l'amico
the neighbour|сосед|el vecino|le voisin|der Nachbar|il vicino
the guest|гость|el invitado|l'invité|der Gast|l'ospite
people|люди|la gente|les gens|die Leute|la gente
the name|имя|el nombre|le prénom|der Name|il nome
` },
{ id: "food", emoji: "🍎", level: "A1", title: { en: "Food", ru: "Еда" }, data: `
the bread|хлеб|el pan|le pain|das Brot|il pane
the cheese|сыр|el queso|le fromage|der Käse|il formaggio
the egg|яйцо|el huevo|l'œuf|das Ei|l'uovo
the meat|мясо|la carne|la viande|das Fleisch|la carne
the chicken|курица|el pollo|le poulet|das Hähnchen|il pollo
the fish|рыба|el pescado|le poisson|der Fisch|il pesce
the rice|рис|el arroz|le riz|der Reis|il riso
the soup|суп|la sopa|la soupe|die Suppe|la zuppa
the salad|салат|la ensalada|la salade|der Salat|l'insalata
the potato|картофель|la patata|la pomme de terre|die Kartoffel|la patata
the tomato|помидор|el tomate|la tomate|die Tomate|il pomodoro
the onion|лук|la cebolla|l'oignon|die Zwiebel|la cipolla
the carrot|морковь|la zanahoria|la carotte|die Karotte|la carota
the fruit|фрукт|la fruta|le fruit|das Obst|la frutta
the apple|яблоко|la manzana|la pomme|der Apfel|la mela
the orange|апельсин|la naranja|l'orange|die Orange|l'arancia
the lemon|лимон|el limón|le citron|die Zitrone|il limone
the strawberry|клубника|la fresa|la fraise|die Erdbeere|la fragola
the butter|масло|la mantequilla|le beurre|die Butter|il burro
the salt|соль|la sal|le sel|das Salz|il sale
the sugar|сахар|el azúcar|le sucre|der Zucker|lo zucchero
the cake|торт|la tarta|le gâteau|der Kuchen|la torta
the chocolate|шоколад|el chocolate|le chocolat|die Schokolade|il cioccolato
the ice cream|мороженое|el helado|la glace|das Eis|il gelato
` },
{ id: "restaurant", emoji: "🍽️", level: "A2", title: { en: "Café and restaurant", ru: "Кафе и ресторан" }, data: `
the water|вода|el agua|l'eau|das Wasser|l'acqua
the coffee|кофе|el café|le café|der Kaffee|il caffè
the tea|чай|el té|le thé|der Tee|il tè
the milk|молоко|la leche|le lait|die Milch|il latte
the juice|сок|el zumo|le jus|der Saft|il succo
the beer|пиво|la cerveza|la bière|das Bier|la birra
the wine|вино|el vino|le vin|der Wein|il vino
the breakfast|завтрак|el desayuno|le petit-déjeuner|das Frühstück|la colazione
the lunch|обед|el almuerzo|le déjeuner|das Mittagessen|il pranzo
the dinner|ужин|la cena|le dîner|das Abendessen|la cena
the menu|меню|el menú|la carte|die Speisekarte|il menù
the bill|счёт|la cuenta|l'addition|die Rechnung|il conto
the tip|чаевые|la propina|le pourboire|das Trinkgeld|la mancia
the waiter|официант|el camarero|le serveur|der Kellner|il cameriere
the plate|тарелка|el plato|l'assiette|der Teller|il piatto
the glass|стакан|el vaso|le verre|das Glas|il bicchiere
the cup|чашка|la taza|la tasse|die Tasse|la tazza
the fork|вилка|el tenedor|la fourchette|die Gabel|la forchetta
the knife|нож|el cuchillo|le couteau|das Messer|il coltello
the spoon|ложка|la cuchara|la cuillère|der Löffel|il cucchiaio
A table for two, please.|Столик на двоих, пожалуйста.|Una mesa para dos, por favor.|Une table pour deux, s'il vous plaît.|Einen Tisch für zwei, bitte.|Un tavolo per due, per favore.
I would like a coffee.|Я бы хотел кофе.|Quisiera un café.|Je voudrais un café.|Ich hätte gern einen Kaffee.|Vorrei un caffè.
The bill, please.|Счёт, пожалуйста.|La cuenta, por favor.|L'addition, s'il vous plaît.|Die Rechnung, bitte.|Il conto, per favore.
It's delicious.|Это вкусно.|Está delicioso.|C'est délicieux.|Es ist lecker.|È delizioso.
` },
{ id: "home", emoji: "🏠", level: "A1", title: { en: "Home", ru: "Дом" }, data: `
the house|дом|la casa|la maison|das Haus|la casa
the flat|квартира|el piso|l'appartement|die Wohnung|l'appartamento
the room|комната|la habitación|la pièce|das Zimmer|la stanza
the kitchen|кухня|la cocina|la cuisine|die Küche|la cucina
the bathroom|ванная|el baño|la salle de bains|das Badezimmer|il bagno
the bedroom|спальня|el dormitorio|la chambre|das Schlafzimmer|la camera da letto
the door|дверь|la puerta|la porte|die Tür|la porta
the window|окно|la ventana|la fenêtre|das Fenster|la finestra
the wall|стена|la pared|le mur|die Wand|la parete
the floor|пол|el suelo|le sol|der Boden|il pavimento
the stairs|лестница|la escalera|l'escalier|die Treppe|le scale
the table|стол|la mesa|la table|der Tisch|il tavolo
the chair|стул|la silla|la chaise|der Stuhl|la sedia
the bed|кровать|la cama|le lit|das Bett|il letto
the sofa|диван|el sofá|le canapé|das Sofa|il divano
the lamp|лампа|la lámpara|la lampe|die Lampe|la lampada
the mirror|зеркало|el espejo|le miroir|der Spiegel|lo specchio
the wardrobe|шкаф|el armario|l'armoire|der Schrank|l'armadio
the fridge|холодильник|la nevera|le frigo|der Kühlschrank|il frigorifero
the key|ключ|la llave|la clé|der Schlüssel|la chiave
the towel|полотенце|la toalla|la serviette|das Handtuch|l'asciugamano
the soap|мыло|el jabón|le savon|die Seife|il sapone
the garden|сад|el jardín|le jardin|der Garten|il giardino
the roof|крыша|el techo|le toit|das Dach|il tetto
` },
{ id: "clothes", emoji: "👕", level: "A1", title: { en: "Clothes", ru: "Одежда" }, data: `
the clothes|одежда|la ropa|les vêtements|die Kleidung|i vestiti
the shirt|рубашка|la camisa|la chemise|das Hemd|la camicia
the T-shirt|футболка|la camiseta|le t-shirt|das T-Shirt|la maglietta
the trousers|брюки|los pantalones|le pantalon|die Hose|i pantaloni
the dress|платье|el vestido|la robe|das Kleid|il vestito
the skirt|юбка|la falda|la jupe|der Rock|la gonna
the jacket|куртка|la chaqueta|la veste|die Jacke|la giacca
the coat|пальто|el abrigo|le manteau|der Mantel|il cappotto
the sweater|свитер|el jersey|le pull|der Pullover|il maglione
the shoes|обувь|los zapatos|les chaussures|die Schuhe|le scarpe
the boots|ботинки|las botas|les bottes|die Stiefel|gli stivali
the socks|носки|los calcetines|les chaussettes|die Socken|i calzini
the hat|шляпа|el sombrero|le chapeau|der Hut|il cappello
the scarf|шарф|la bufanda|l'écharpe|der Schal|la sciarpa
the gloves|перчатки|los guantes|les gants|die Handschuhe|i guanti
the belt|ремень|el cinturón|la ceinture|der Gürtel|la cintura
the bag|сумка|el bolso|le sac|die Tasche|la borsa
the glasses|очки|las gafas|les lunettes|die Brille|gli occhiali
the watch|часы|el reloj|la montre|die Uhr|l'orologio
the ring|кольцо|el anillo|la bague|der Ring|l'anello
the pocket|карман|el bolsillo|la poche|die Hosentasche|la tasca
the size|размер|la talla|la taille|die Größe|la taglia
` },
{ id: "colours", emoji: "🎨", level: "A1", title: { en: "Colours and shapes", ru: "Цвета и формы" }, data: `
red|красный|rojo|rouge|rot|rosso
blue|синий|azul|bleu|blau|blu
green|зелёный|verde|vert|grün|verde
yellow|жёлтый|amarillo|jaune|gelb|giallo
black|чёрный|negro|noir|schwarz|nero
white|белый|blanco|blanc|weiß|bianco
grey|серый|gris|gris|grau|grigio
brown|коричневый|marrón|marron|braun|marrone
pink|розовый|rosa|rose|rosa|rosa
orange (colour)|оранжевый|naranja|orange|orange|arancione
purple|фиолетовый|morado|violet|lila|viola
golden|золотой|dorado|doré|golden|dorato
silver (colour)|серебряный|plateado|argenté|silbern|argentato
light (colour)|светлый|claro|clair|hell|chiaro
dark|тёмный|oscuro|foncé|dunkel|scuro
the circle|круг|el círculo|le cercle|der Kreis|il cerchio
the square|квадрат|el cuadrado|le carré|das Quadrat|il quadrato
the triangle|треугольник|el triángulo|le triangle|das Dreieck|il triangolo
the line|линия|la línea|la ligne|die Linie|la linea
round|круглый|redondo|rond|rund|rotondo
` },
{ id: "body", emoji: "🫀", level: "A2", title: { en: "Body and health", ru: "Тело и здоровье" }, data: `
the head|голова|la cabeza|la tête|der Kopf|la testa
the face|лицо|la cara|le visage|das Gesicht|il viso
the eye|глаз|el ojo|l'œil|das Auge|l'occhio
the ear|ухо|la oreja|l'oreille|das Ohr|l'orecchio
the nose|нос|la nariz|le nez|die Nase|il naso
the mouth|рот|la boca|la bouche|der Mund|la bocca
the tooth|зуб|el diente|la dent|der Zahn|il dente
the hair|волосы|el pelo|les cheveux|die Haare|i capelli
the neck|шея|el cuello|le cou|der Hals|il collo
the hand|кисть руки|la mano|la main|die Hand|la mano
the arm|рука|el brazo|le bras|der Arm|il braccio
the finger|палец|el dedo|le doigt|der Finger|il dito
the leg|нога|la pierna|la jambe|das Bein|la gamba
the foot|стопа|el pie|le pied|der Fuß|il piede
the back|спина|la espalda|le dos|der Rücken|la schiena
the stomach|живот|el estómago|le ventre|der Bauch|la pancia
the heart|сердце|el corazón|le cœur|das Herz|il cuore
the blood|кровь|la sangre|le sang|das Blut|il sangue
the doctor|врач|el médico|le médecin|der Arzt|il medico
the hospital|больница|el hospital|l'hôpital|das Krankenhaus|l'ospedale
the pharmacy|аптека|la farmacia|la pharmacie|die Apotheke|la farmacia
the medicine|лекарство|el medicamento|le médicament|das Medikament|la medicina
the pain|боль|el dolor|la douleur|der Schmerz|il dolore
the fever|температура|la fiebre|la fièvre|das Fieber|la febbre
the cold (illness)|простуда|el resfriado|le rhume|die Erkältung|il raffreddore
the health|здоровье|la salud|la santé|die Gesundheit|la salute
` },
{ id: "city", emoji: "🏙️", level: "A1", title: { en: "City", ru: "Город" }, data: `
the city|город|la ciudad|la ville|die Stadt|la città
the street|улица|la calle|la rue|die Straße|la strada
the square (place)|площадь|la plaza|la place|der Platz|la piazza
the bridge|мост|el puente|le pont|die Brücke|il ponte
the park|парк|el parque|le parc|der Park|il parco
the shop|магазин|la tienda|le magasin|der Laden|il negozio
the market|рынок|el mercado|le marché|der Markt|il mercato
the bank|банк|el banco|la banque|die Bank|la banca
the post office|почта|la oficina de correos|la poste|die Post|l'ufficio postale
the church|церковь|la iglesia|l'église|die Kirche|la chiesa
the museum|музей|el museo|le musée|das Museum|il museo
the library|библиотека|la biblioteca|la bibliothèque|die Bibliothek|la biblioteca
the cinema|кинотеатр|el cine|le cinéma|das Kino|il cinema
the theatre|театр|el teatro|le théâtre|das Theater|il teatro
the police|полиция|la policía|la police|die Polizei|la polizia
the building|здание|el edificio|le bâtiment|das Gebäude|l'edificio
the corner|угол|la esquina|le coin|die Ecke|l'angolo
the traffic light|светофор|el semáforo|le feu|die Ampel|il semaforo
left|налево|a la izquierda|à gauche|links|a sinistra
right|направо|a la derecha|à droite|rechts|a destra
straight ahead|прямо|todo recto|tout droit|geradeaus|dritto
near|рядом|cerca|près|nah|vicino
far|далеко|lejos|loin|weit|lontano
the map|карта|el mapa|la carte|der Stadtplan|la mappa
` },
{ id: "travel", emoji: "✈️", level: "A2", title: { en: "Travel", ru: "Путешествия" }, data: `
the trip|поездка|el viaje|le voyage|die Reise|il viaggio
the airport|аэропорт|el aeropuerto|l'aéroport|der Flughafen|l'aeroporto
the plane|самолёт|el avión|l'avion|das Flugzeug|l'aereo
the train|поезд|el tren|le train|der Zug|il treno
the station|вокзал|la estación|la gare|der Bahnhof|la stazione
the bus|автобус|el autobús|le bus|der Bus|l'autobus
the underground|метро|el metro|le métro|die U-Bahn|la metropolitana
the car|машина|el coche|la voiture|das Auto|la macchina
the bicycle|велосипед|la bicicleta|le vélo|das Fahrrad|la bicicletta
the ship|корабль|el barco|le bateau|das Schiff|la nave
the ticket|билет|el billete|le billet|die Fahrkarte|il biglietto
the passport|паспорт|el pasaporte|le passeport|der Reisepass|il passaporto
the suitcase|чемодан|la maleta|la valise|der Koffer|la valigia
the luggage|багаж|el equipaje|les bagages|das Gepäck|i bagagli
the hotel|отель|el hotel|l'hôtel|das Hotel|l'albergo
the reservation|бронь|la reserva|la réservation|die Reservierung|la prenotazione
the flight|рейс|el vuelo|le vol|der Flug|il volo
the departure|отправление|la salida|le départ|die Abfahrt|la partenza
the arrival|прибытие|la llegada|l'arrivée|die Ankunft|l'arrivo
the border|граница|la frontera|la frontière|die Grenze|il confine
the holiday|отпуск|las vacaciones|les vacances|der Urlaub|le vacanze
the tourist|турист|el turista|le touriste|der Tourist|il turista
Where is the station?|Где вокзал?|¿Dónde está la estación?|Où est la gare ?|Wo ist der Bahnhof?|Dov'è la stazione?
I'm lost.|Я заблудился.|Estoy perdido.|Je suis perdu.|Ich habe mich verlaufen.|Mi sono perso.
I have a reservation.|У меня есть бронь.|Tengo una reserva.|J'ai une réservation.|Ich habe eine Reservierung.|Ho una prenotazione.
What time does the train leave?|Во сколько отходит поезд?|¿A qué hora sale el tren?|À quelle heure part le train ?|Wann fährt der Zug ab?|A che ora parte il treno?
` },
{ id: "shopping", emoji: "🛍️", level: "A2", title: { en: "Shopping and money", ru: "Покупки и деньги" }, data: `
the money|деньги|el dinero|l'argent|das Geld|i soldi
the price|цена|el precio|le prix|der Preis|il prezzo
the coin|монета|la moneda|la pièce de monnaie|die Münze|la moneta
the cash|наличные|el efectivo|les espèces|das Bargeld|i contanti
the credit card|кредитная карта|la tarjeta de crédito|la carte de crédit|die Kreditkarte|la carta di credito
the change|сдача|el cambio|la monnaie|das Wechselgeld|il resto
the receipt|чек|el recibo|le reçu|der Kassenbon|lo scontrino
the discount|скидка|el descuento|la réduction|der Rabatt|lo sconto
the customer|клиент|el cliente|le client|der Kunde|il cliente
the seller|продавец|el vendedor|le vendeur|der Verkäufer|il venditore
the gift|подарок|el regalo|le cadeau|das Geschenk|il regalo
the wallet|кошелёк|la cartera|le portefeuille|der Geldbeutel|il portafoglio
cheap|дешёвый|barato|bon marché|billig|economico
expensive|дорогой|caro|cher|teuer|caro
open|открытый|abierto|ouvert|geöffnet|aperto
closed|закрытый|cerrado|fermé|geschlossen|chiuso
How much does it cost?|Сколько это стоит?|¿Cuánto cuesta?|Combien ça coûte ?|Wie viel kostet das?|Quanto costa?
I'm just looking.|Я просто смотрю.|Solo estoy mirando.|Je regarde seulement.|Ich schaue mich nur um.|Sto solo guardando.
Can I try it on?|Можно примерить?|¿Puedo probármelo?|Je peux l'essayer ?|Kann ich das anprobieren?|Posso provarlo?
It's too expensive.|Это слишком дорого.|Es demasiado caro.|C'est trop cher.|Das ist zu teuer.|È troppo caro.
Can I pay by card?|Можно оплатить картой?|¿Puedo pagar con tarjeta?|Je peux payer par carte ?|Kann ich mit Karte zahlen?|Posso pagare con la carta?
` },
{ id: "nature", emoji: "🌿", level: "A2", title: { en: "Nature", ru: "Природа" }, data: `
the sun|солнце|el sol|le soleil|die Sonne|il sole
the moon|луна|la luna|la lune|der Mond|la luna
the star|звезда|la estrella|l'étoile|der Stern|la stella
the sky|небо|el cielo|le ciel|der Himmel|il cielo
the earth|земля|la tierra|la terre|die Erde|la terra
the sea|море|el mar|la mer|das Meer|il mare
the river|река|el río|la rivière|der Fluss|il fiume
the lake|озеро|el lago|le lac|der See|il lago
the mountain|гора|la montaña|la montagne|der Berg|la montagna
the forest|лес|el bosque|la forêt|der Wald|il bosco
the tree|дерево|el árbol|l'arbre|der Baum|l'albero
the flower|цветок|la flor|la fleur|die Blume|il fiore
the grass|трава|la hierba|l'herbe|das Gras|l'erba
the leaf|лист|la hoja|la feuille|das Blatt|la foglia
the beach|пляж|la playa|la plage|der Strand|la spiaggia
the island|остров|la isla|l'île|die Insel|l'isola
the stone|камень|la piedra|la pierre|der Stein|la pietra
the sand|песок|la arena|le sable|der Sand|la sabbia
the fire|огонь|el fuego|le feu|das Feuer|il fuoco
the air|воздух|el aire|l'air|die Luft|l'aria
the world|мир|el mundo|le monde|die Welt|il mondo
the field|поле|el campo|le champ|das Feld|il campo
` },
{ id: "weather", emoji: "⛅", level: "A2", title: { en: "Weather", ru: "Погода" }, data: `
the weather|погода|el tiempo|le temps|das Wetter|il tempo
the rain|дождь|la lluvia|la pluie|der Regen|la pioggia
the snow|снег|la nieve|la neige|der Schnee|la neve
the wind|ветер|el viento|le vent|der Wind|il vento
the cloud|облако|la nube|le nuage|die Wolke|la nuvola
the storm|буря|la tormenta|la tempête|der Sturm|la tempesta
the fog|туман|la niebla|le brouillard|der Nebel|la nebbia
the ice|лёд|el hielo|la glace|das Eis|il ghiaccio
the heat|жара|el calor|la chaleur|die Hitze|il caldo
the cold|холод|el frío|le froid|die Kälte|il freddo
the temperature|градусы температуры|la temperatura|la température|die Temperatur|la temperatura
the umbrella|зонт|el paraguas|le parapluie|der Regenschirm|l'ombrello
the rainbow|радуга|el arcoíris|l'arc-en-ciel|der Regenbogen|l'arcobaleno
warm|тёплый|cálido|chaud|warm|tiepido
cool|прохладный|fresco|frais|kühl|fresco
wet|мокрый|mojado|mouillé|nass|bagnato
dry|сухой|seco|sec|trocken|asciutto
It's raining.|Идёт дождь.|Está lloviendo.|Il pleut.|Es regnet.|Piove.
It's snowing.|Идёт снег.|Está nevando.|Il neige.|Es schneit.|Nevica.
It's hot today.|Сегодня жарко.|Hoy hace calor.|Il fait chaud aujourd'hui.|Heute ist es heiß.|Oggi fa caldo.
` },
{ id: "animals", emoji: "🐾", level: "A1", title: { en: "Animals", ru: "Животные" }, data: `
the dog|собака|el perro|le chien|der Hund|il cane
the cat|кошка|el gato|le chat|die Katze|il gatto
the horse|лошадь|el caballo|le cheval|das Pferd|il cavallo
the cow|корова|la vaca|la vache|die Kuh|la mucca
the pig|свинья|el cerdo|le cochon|das Schwein|il maiale
the sheep|овца|la oveja|le mouton|das Schaf|la pecora
the goat|коза|la cabra|la chèvre|die Ziege|la capra
the bird|птица|el pájaro|l'oiseau|der Vogel|l'uccello
the duck|утка|el pato|le canard|die Ente|l'anatra
the rabbit|кролик|el conejo|le lapin|das Kaninchen|il coniglio
the mouse|мышь|el ratón|la souris|die Maus|il topo
the bear|медведь|el oso|l'ours|der Bär|l'orso
the wolf|волк|el lobo|le loup|der Wolf|il lupo
the fox|лиса|el zorro|le renard|der Fuchs|la volpe
the lion|лев|el león|le lion|der Löwe|il leone
the elephant|слон|el elefante|l'éléphant|der Elefant|l'elefante
the monkey|обезьяна|el mono|le singe|der Affe|la scimmia
the snake|змея|la serpiente|le serpent|die Schlange|il serpente
the frog|лягушка|la rana|la grenouille|der Frosch|la rana
the turtle|черепаха|la tortuga|la tortue|die Schildkröte|la tartaruga
the bee|пчела|la abeja|l'abeille|die Biene|l'ape
the butterfly|бабочка|la mariposa|le papillon|der Schmetterling|la farfalla
the spider|паук|la araña|l'araignée|die Spinne|il ragno
the whale|кит|la ballena|la baleine|der Wal|la balena
` },
{ id: "work", emoji: "💼", level: "A2", title: { en: "Work", ru: "Работа" }, data: `
the work|работа|el trabajo|le travail|die Arbeit|il lavoro
the office|офис|la oficina|le bureau|das Büro|l'ufficio
the company|компания|la empresa|l'entreprise|die Firma|l'azienda
the boss|начальник|el jefe|le chef|der Chef|il capo
the colleague|коллега|el colega|le collègue|der Kollege|il collega
the meeting|встреча|la reunión|la réunion|die Besprechung|la riunione
the task|задача|la tarea|la tâche|die Aufgabe|il compito
the project|проект|el proyecto|le projet|das Projekt|il progetto
the contract|договор|el contrato|le contrat|der Vertrag|il contratto
the salary|зарплата|el salario|le salaire|das Gehalt|lo stipendio
the interview|собеседование|la entrevista|l'entretien|das Vorstellungsgespräch|il colloquio
the job ad|вакансия|la oferta de empleo|l'offre d'emploi|das Stellenangebot|l'offerta di lavoro
the experience|опыт|la experiencia|l'expérience|die Erfahrung|l'esperienza
the engineer|инженер|el ingeniero|l'ingénieur|der Ingenieur|l'ingegnere
the lawyer|юрист|el abogado|l'avocat|der Anwalt|l'avvocato
the nurse|медсестра|la enfermera|l'infirmière|die Krankenschwester|l'infermiera
the cook|повар|el cocinero|le cuisinier|der Koch|il cuoco
the driver|водитель|el conductor|le conducteur|der Fahrer|l'autista
the success|успех|el éxito|le succès|der Erfolg|il successo
the mistake|ошибка|el error|l'erreur|der Fehler|l'errore
the decision|решение|la decisión|la décision|die Entscheidung|la decisione
the goal|цель|el objetivo|l'objectif|das Ziel|l'obiettivo
` },
{ id: "school", emoji: "🎓", level: "A2", title: { en: "Study", ru: "Учёба" }, data: `
the school|школа|la escuela|l'école|die Schule|la scuola
the university|университет|la universidad|l'université|die Universität|l'università
the teacher|учитель|el profesor|le professeur|der Lehrer|l'insegnante
the student|студент|el estudiante|l'étudiant|der Student|lo studente
the lesson|урок|la clase|le cours|der Unterricht|la lezione
the book|книга|el libro|le livre|das Buch|il libro
the notebook|тетрадь|el cuaderno|le cahier|das Heft|il quaderno
the pen|ручка|el bolígrafo|le stylo|der Kugelschreiber|la penna
the pencil|карандаш|el lápiz|le crayon|der Bleistift|la matita
the paper|бумага|el papel|le papier|das Papier|la carta
the page|страница|la página|la page|die Seite|la pagina
the word|слово|la palabra|le mot|das Wort|la parola
the sentence|предложение|la frase|la phrase|der Satz|la frase
the language|язык|el idioma|la langue|die Sprache|la lingua
the question|вопрос|la pregunta|la question|die Frage|la domanda
the answer|ответ|la respuesta|la réponse|die Antwort|la risposta
the exam|экзамен|el examen|l'examen|die Prüfung|l'esame
the homework|домашнее задание|los deberes|les devoirs|die Hausaufgabe|i compiti
the knowledge|знания|el conocimiento|les connaissances|das Wissen|la conoscenza
the history|история|la historia|l'histoire|die Geschichte|la storia
the science|наука|la ciencia|la science|die Wissenschaft|la scienza
the memory|память|la memoria|la mémoire|das Gedächtnis|la memoria
` },
{ id: "tech", emoji: "💻", level: "A2", title: { en: "Technology", ru: "Технологии" }, data: `
the computer|компьютер|el ordenador|l'ordinateur|der Computer|il computer
the phone|телефон|el teléfono|le téléphone|das Telefon|il telefono
the screen|экран|la pantalla|l'écran|der Bildschirm|lo schermo
the keyboard|клавиатура|el teclado|le clavier|die Tastatur|la tastiera
the battery|батарея|la batería|la batterie|der Akku|la batteria
the charger|зарядка|el cargador|le chargeur|das Ladegerät|il caricabatterie
the password|пароль|la contraseña|le mot de passe|das Passwort|la password
the file|файл|el archivo|le fichier|die Datei|il file
the folder|папка|la carpeta|le dossier|der Ordner|la cartella
the website|сайт|el sitio web|le site web|die Webseite|il sito web
the link|ссылка|el enlace|le lien|der Link|il link
the message|сообщение|el mensaje|le message|die Nachricht|il messaggio
the email|электронное письмо|el correo electrónico|le courriel|die E-Mail|l'e-mail
the photo|фотография|la foto|la photo|das Foto|la foto
the camera|камера|la cámara|l'appareil photo|die Kamera|la macchina fotografica
the network|сеть|la red|le réseau|das Netzwerk|la rete
the button|кнопка|el botón|le bouton|die Taste|il pulsante
the user|пользователь|el usuario|l'utilisateur|der Benutzer|l'utente
the headphones|наушники|los auriculares|les écouteurs|die Kopfhörer|le cuffie
the printer|принтер|la impresora|l'imprimante|der Drucker|la stampante
` },
{ id: "hobbies", emoji: "⚽", level: "A2", title: { en: "Sport and hobbies", ru: "Спорт и хобби" }, data: `
the sport|спорт|el deporte|le sport|der Sport|lo sport
the game|игра|el juego|le jeu|das Spiel|il gioco
the team|команда|el equipo|l'équipe|die Mannschaft|la squadra
the football|футбол|el fútbol|le football|der Fußball|il calcio
the swimming|плавание|la natación|la natation|das Schwimmen|il nuoto
the running|бег|la carrera|la course à pied|das Laufen|la corsa
the gym|спортзал|el gimnasio|la salle de sport|das Fitnessstudio|la palestra
the training|тренировка|el entrenamiento|l'entraînement|das Training|l'allenamento
the music|музыка|la música|la musique|die Musik|la musica
the song|песня|la canción|la chanson|das Lied|la canzone
the guitar|гитара|la guitarra|la guitare|die Gitarre|la chitarra
the dance|танец|el baile|la danse|der Tanz|il ballo
the film|фильм|la película|le film|der Film|il film
the painting|картина|el cuadro|le tableau|das Gemälde|il quadro
the drawing|рисунок|el dibujo|le dessin|die Zeichnung|il disegno
the reading|чтение|la lectura|la lecture|das Lesen|la lettura
the cooking|готовка|la cocina|la cuisine|das Kochen|la cucina
the walk|прогулка|el paseo|la promenade|der Spaziergang|la passeggiata
the hike|поход|la caminata|la randonnée|die Wanderung|l'escursione
the ball|мяч|la pelota|le ballon|der Ball|la palla
the victory|победа|la victoria|la victoire|der Sieg|la vittoria
the free time|свободное время|el tiempo libre|le temps libre|die Freizeit|il tempo libero
` },
{ id: "feelings", emoji: "💛", level: "B1", title: { en: "Feelings and character", ru: "Чувства и характер" }, data: `
the love|любовь|el amor|l'amour|die Liebe|l'amore
the joy|радость|la alegría|la joie|die Freude|la gioia
the fear|страх|el miedo|la peur|die Angst|la paura
the anger|гнев|la ira|la colère|die Wut|la rabbia
the sadness|грусть|la tristeza|la tristesse|die Traurigkeit|la tristezza
the hope|надежда|la esperanza|l'espoir|die Hoffnung|la speranza
the surprise|удивление|la sorpresa|la surprise|die Überraschung|la sorpresa
the trust|доверие|la confianza|la confiance|das Vertrauen|la fiducia
the dream|мечта|el sueño|le rêve|der Traum|il sogno
the friendship|дружба|la amistad|l'amitié|die Freundschaft|l'amicizia
happy|счастливый|feliz|heureux|glücklich|felice
sad|грустный|triste|triste|traurig|triste
tired|уставший|cansado|fatigué|müde|stanco
calm|спокойный|tranquilo|calme|ruhig|calmo
brave|смелый|valiente|courageux|mutig|coraggioso
kind|добрый|amable|gentil|nett|gentile
honest|честный|honesto|honnête|ehrlich|onesto
lazy|ленивый|perezoso|paresseux|faul|pigro
proud|гордый|orgulloso|fier|stolz|orgoglioso
jealous|ревнивый|celoso|jaloux|eifersüchtig|geloso
shy|застенчивый|tímido|timide|schüchtern|timido
patient|терпеливый|paciente|patient|geduldig|paziente
` },
{ id: "adjectives", emoji: "📏", level: "A2", title: { en: "Opposites", ru: "Противоположности" }, data: `
big|большой|grande|grand|groß|grande
small|маленький|pequeño|petit|klein|piccolo
good|хороший|bueno|bon|gut|buono
bad|плохой|malo|mauvais|schlecht|cattivo
new|новый|nuevo|nouveau|neu|nuovo
old|старый|viejo|vieux|alt|vecchio
young|молодой|joven|jeune|jung|giovane
long|длинный|largo|long|lang|lungo
short|короткий|corto|court|kurz|corto
tall|высокий|alto|haut|hoch|alto
low|низкий|bajo|bas|niedrig|basso
fast|быстрый|rápido|rapide|schnell|veloce
slow|медленный|lento|lent|langsam|lento
easy|лёгкий|fácil|facile|einfach|facile
difficult|трудный|difícil|difficile|schwierig|difficile
strong|сильный|fuerte|fort|stark|forte
weak|слабый|débil|faible|schwach|debole
full|полный|lleno|plein|voll|pieno
empty|пустой|vacío|vide|leer|vuoto
clean|чистый|limpio|propre|sauber|pulito
dirty|грязный|sucio|sale|schmutzig|sporco
beautiful|красивый|hermoso|beau|schön|bello
ugly|уродливый|feo|laid|hässlich|brutto
important|важный|importante|important|wichtig|importante
interesting|интересный|interesante|intéressant|interessant|interessante
boring|скучный|aburrido|ennuyeux|langweilig|noioso
` },
{ id: "verbs", emoji: "🏃", level: "A1", title: { en: "Key verbs with examples", ru: "Главные глаголы с примерами" }, data: `
to have|иметь|tener|avoir|haben|avere
>I have a question.|У меня есть вопрос.|Tengo una pregunta.|J'ai une question.|Ich habe eine Frage.|Ho una domanda.
to do|делать|hacer|faire|machen|fare
>What are you doing?|Что ты делаешь?|¿Qué haces?|Qu'est-ce que tu fais ?|Was machst du?|Che cosa fai?
to go|идти|ir|aller|gehen|andare
>We are going home.|Мы идём домой.|Vamos a casa.|Nous allons à la maison.|Wir gehen nach Hause.|Andiamo a casa.
to come|приходить|venir|venir|kommen|venire
>She comes every day.|Она приходит каждый день.|Viene todos los días.|Elle vient tous les jours.|Sie kommt jeden Tag.|Viene ogni giorno.
to want|хотеть|querer|vouloir|wollen|volere
>I want to learn.|Я хочу учиться.|Quiero aprender.|Je veux apprendre.|Ich will lernen.|Voglio imparare.
can|мочь|poder|pouvoir|können|potere
>I can help you.|Я могу тебе помочь.|Puedo ayudarte.|Je peux t'aider.|Ich kann dir helfen.|Posso aiutarti.
to know|знать|saber|savoir|wissen|sapere
>He knows the answer.|Он знает ответ.|Sabe la respuesta.|Il sait la réponse.|Er weiß die Antwort.|Sa la risposta.
to say|сказать|decir|dire|sagen|dire
>What did you say?|Что ты сказал?|¿Qué has dicho?|Qu'est-ce que tu as dit ?|Was hast du gesagt?|Che cosa hai detto?
to speak|говорить|hablar|parler|sprechen|parlare
>Do you speak English?|Ты говоришь по-английски?|¿Hablas inglés?|Tu parles anglais ?|Sprichst du Englisch?|Parli inglese?
to see|видеть|ver|voir|sehen|vedere
>I see the sea.|Я вижу море.|Veo el mar.|Je vois la mer.|Ich sehe das Meer.|Vedo il mare.
to hear|слышать|oír|entendre|hören|sentire
>I can't hear you.|Я тебя не слышу.|No te oigo.|Je ne t'entends pas.|Ich höre dich nicht.|Non ti sento.
to eat|есть|comer|manger|essen|mangiare
>We eat at home.|Мы едим дома.|Comemos en casa.|Nous mangeons à la maison.|Wir essen zu Hause.|Mangiamo a casa.
to drink|пить|beber|boire|trinken|bere
>I drink water.|Я пью воду.|Bebo agua.|Je bois de l'eau.|Ich trinke Wasser.|Bevo acqua.
to sleep|спать|dormir|dormir|schlafen|dormire
>The child is sleeping.|Ребёнок спит.|El niño duerme.|L'enfant dort.|Das Kind schläft.|Il bambino dorme.
to live|жить|vivir|vivre|leben|vivere
>They live in Berlin.|Они живут в Берлине.|Viven en Berlín.|Ils vivent à Berlin.|Sie leben in Berlin.|Vivono a Berlino.
to work|работать|trabajar|travailler|arbeiten|lavorare
>I work from home.|Я работаю из дома.|Trabajo desde casa.|Je travaille à la maison.|Ich arbeite von zu Hause.|Lavoro da casa.
to read|читать|leer|lire|lesen|leggere
>She is reading a book.|Она читает книгу.|Lee un libro.|Elle lit un livre.|Sie liest ein Buch.|Legge un libro.
to write|писать|escribir|écrire|schreiben|scrivere
>Write your name here.|Напиши своё имя здесь.|Escribe tu nombre aquí.|Écris ton nom ici.|Schreib deinen Namen hier.|Scrivi qui il tuo nome.
to learn|учить|aprender|apprendre|lernen|imparare
>I learn ten words a day.|Я учу десять слов в день.|Aprendo diez palabras al día.|J'apprends dix mots par jour.|Ich lerne zehn Wörter am Tag.|Imparo dieci parole al giorno.
to understand|понимать|entender|comprendre|verstehen|capire
>Do you understand me?|Ты меня понимаешь?|¿Me entiendes?|Tu me comprends ?|Verstehst du mich?|Mi capisci?
to think|думать|pensar|penser|denken|pensare
>I think about you.|Я думаю о тебе.|Pienso en ti.|Je pense à toi.|Ich denke an dich.|Penso a te.
to find|находить|encontrar|trouver|finden|trovare
>I can't find my keys.|Я не могу найти ключи.|No encuentro mis llaves.|Je ne trouve pas mes clés.|Ich finde meine Schlüssel nicht.|Non trovo le mie chiavi.
to buy|покупать|comprar|acheter|kaufen|comprare
>I am buying bread.|Я покупаю хлеб.|Compro pan.|J'achète du pain.|Ich kaufe Brot.|Compro il pane.
to pay|платить|pagar|payer|bezahlen|pagare
>Who is paying?|Кто платит?|¿Quién paga?|Qui paie ?|Wer bezahlt?|Chi paga?
to give|давать|dar|donner|geben|dare
>Give me the book.|Дай мне книгу.|Dame el libro.|Donne-moi le livre.|Gib mir das Buch.|Dammi il libro.
to take|брать|tomar|prendre|nehmen|prendere
>I take the bus.|Я еду на автобусе.|Tomo el autobús.|Je prends le bus.|Ich nehme den Bus.|Prendo l'autobus.
to help|помогать|ayudar|aider|helfen|aiutare
>Can you help me?|Ты можешь мне помочь?|¿Puedes ayudarme?|Tu peux m'aider ?|Kannst du mir helfen?|Puoi aiutarmi?
to wait|ждать|esperar|attendre|warten|aspettare
>We are waiting for the train.|Мы ждём поезд.|Esperamos el tren.|Nous attendons le train.|Wir warten auf den Zug.|Aspettiamo il treno.
to open|открывать|abrir|ouvrir|öffnen|aprire
>Open the window, please.|Открой окно, пожалуйста.|Abre la ventana, por favor.|Ouvre la fenêtre, s'il te plaît.|Öffne bitte das Fenster.|Apri la finestra, per favore.
to close|закрывать|cerrar|fermer|schließen|chiudere
>Close the door.|Закрой дверь.|Cierra la puerta.|Ferme la porte.|Schließ die Tür.|Chiudi la porta.
` },
{ id: "verbs2", emoji: "⚡", level: "A2", title: { en: "More verbs", ru: "Ещё глаголы" }, data: `
to begin|начинать|empezar|commencer|anfangen|cominciare
to finish|заканчивать|terminar|finir|beenden|finire
to ask|спрашивать|preguntar|demander|fragen|chiedere
to answer|отвечать|responder|répondre|antworten|rispondere
to remember|помнить|recordar|se souvenir|sich erinnern|ricordare
to forget|забывать|olvidar|oublier|vergessen|dimenticare
to love|любить|amar|aimer|lieben|amare
to believe|верить|creer|croire|glauben|credere
to search|искать|buscar|chercher|suchen|cercare
to play|играть|jugar|jouer|spielen|giocare
to run|бежать|correr|courir|laufen|correre
to swim|плавать|nadar|nager|schwimmen|nuotare
to sing|петь|cantar|chanter|singen|cantare
to dance|танцевать|bailar|danser|tanzen|ballare
to cook|готовить|cocinar|cuisiner|kochen|cucinare
to clean|убирать|limpiar|nettoyer|putzen|pulire
to travel|путешествовать|viajar|voyager|reisen|viaggiare
to arrive|прибывать|llegar|arriver|ankommen|arrivare
to leave|уходить|salir|partir|weggehen|uscire
to return|возвращаться|volver|revenir|zurückkommen|tornare
to sell|продавать|vender|vendre|verkaufen|vendere
to send|отправлять|enviar|envoyer|schicken|inviare
to receive|получать|recibir|recevoir|bekommen|ricevere
to choose|выбирать|elegir|choisir|wählen|scegliere
to try|пробовать|intentar|essayer|versuchen|provare
to change|менять|cambiar|changer|ändern|cambiare
to lose|терять|perder|perdre|verlieren|perdere
to win|выигрывать|ganar|gagner|gewinnen|vincere
to laugh|смеяться|reír|rire|lachen|ridere
to cry|плакать|llorar|pleurer|weinen|piangere
` },
];
