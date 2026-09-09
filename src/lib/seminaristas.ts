export interface Seminarista {
  id: string;
  name: string;
  stage: string;
  diocese: string;
  phone?: string;
  docId?: string;
}

export const SEMINARISTAS_DIRECTORY: Seminarista[] = [
  // 4° DE TEOLOGÍA (8)
  { id: 't4-1', name: 'Rixio Ramón García Montilla', stage: '4° de Teología', diocese: 'Maracaibo', phone: '0414-6237673', docId: 'V-13.950.483' },
  { id: 't4-2', name: 'Ricardo Andrés Márquez Colina', stage: '4° de Teología', diocese: 'Maracaibo', phone: '0414-6237673', docId: 'V-25.906.935' },
  { id: 't4-3', name: 'Ricardo José Morillo Medina', stage: '4° de Teología', diocese: 'Cabimas', phone: '0414-3686447', docId: 'V-26.025.655' },
  { id: 't4-4', name: 'Jesús Javier Ochoa Betin', stage: '4° de Teología', diocese: 'Maracaibo', phone: '0426-1634973', docId: 'V-22.149.652' },
  { id: 't4-5', name: 'Víctor Julio Suárez Quintero', stage: '4° de Teología', diocese: 'Cabimas', phone: '0414-6297214', docId: 'V-24.910.923' },
  { id: 't4-6', name: 'Jesús David Tudares Labarca', stage: '4° de Teología', diocese: 'Maracaibo', phone: '0412-7647587', docId: 'V-30.200.757' },
  { id: 't4-7', name: 'Paúl David Urdaneta Berrueta', stage: '4° de Teología', diocese: 'Maracaibo', phone: '0414-6164561', docId: 'V-30.413.000' },
  { id: 't4-8', name: 'Jorge Luis Villalobos González', stage: '4° de Teología', diocese: 'Maracaibo', phone: '0412-6933938', docId: 'V-26.639.320' },

  // 3° DE TEOLOGÍA (2)
  { id: 't3-1', name: 'Andrés Alfonso Araviche Chiquito', stage: '3° de Teología', diocese: 'Maracaibo', phone: '0424-6526384', docId: 'V-30.412.472' },
  { id: 't3-2', name: 'Nixon Luis Torrealba García', stage: '3° de Teología', diocese: 'Maracaibo', phone: '0412-6600977', docId: 'V-28.509.786' },

  // 2° DE TEOLOGÍA (2)
  { id: 't2-1', name: 'Jossue Alejandro Hernández Miquilena', stage: '2° de Teología', diocese: 'Coro', phone: '0412-0326057', docId: 'V-28.743.500' },
  { id: 't2-2', name: 'Cesar David Petit Hansen', stage: '2° de Teología', diocese: 'Coro', phone: '0424-6176664', docId: 'V-30.948.771' },

  // 1° DE TEOLOGÍA (7)
  { id: 't1-1', name: 'José Francisco Acosta Basabe', stage: '1° de Teología', diocese: 'Maracaibo', phone: '0414-6062204', docId: 'V-30.929.782' },
  { id: 't1-2', name: 'Dany Rafael Araujo Guédez', stage: '1° de Teología', diocese: 'Maracaibo', phone: '0424-6058254', docId: 'V-16.687.898' },
  { id: 't1-3', name: 'Luis Ángel Benítez Morán', stage: '1° de Teología', diocese: 'Maracaibo', phone: '0412-2587049', docId: 'V-18.576.312' },
  { id: 't1-4', name: 'Yorvi Ernesto Chirino Reyes', stage: '1° de Teología', diocese: 'Coro', phone: '0412-1235069', docId: 'V-29.871.650' },
  { id: 't1-5', name: 'Juan Francisco Higuera Jiménez', stage: '1° de Teología', diocese: 'Coro', phone: '0424-6596995', docId: 'V-30.892.603' },
  { id: 't1-6', name: 'David Armando Paz Benavides', stage: '1° de Teología', diocese: 'Maracaibo', phone: '0422-7649931', docId: 'V-26.860.215' },
  { id: 't1-7', name: 'Yorby Javier Suárez Suárez', stage: '1° de Teología', diocese: 'Cabimas', phone: '0416-1454342', docId: 'V-24.909.124' },

  // 3° DE FILOSOFÍA (3)
  { id: 'f3-1', name: 'José Eloy Castillo Pirela', stage: '3° de Filosofía', diocese: 'Cabimas', phone: '0424-6929917', docId: 'V-25.788.670' },
  { id: 'f3-2', name: 'Jorge Luis Reyes Gutiérrez', stage: '3° de Filosofía', diocese: 'Maracaibo', phone: '0412-3798878', docId: 'V-29.818.694' },
  { id: 'f3-3', name: 'Mario José Soto Villasmil', stage: '3° de Filosofía', diocese: 'Maracaibo', phone: '0414-6040830', docId: 'V-29.816.083' },

  // 2° DE FILOSOFÍA (9)
  { id: 'f2-1', name: 'Alfenyer Alfonso Fernández Luzardo', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0424-6287918', docId: 'V-27.744.874' },
  { id: 'f2-2', name: 'Gregory José García Hernández', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0424-6989382', docId: 'V-29.950.931' },
  { id: 'f2-3', name: 'Ranses Isaac Mercado Osorio', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0412-7017059', docId: 'V-29.646.693' },
  { id: 'f2-4', name: 'Luis Carlos Polanco Fernández', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0412-9195877', docId: 'V-32.567.447' },
  { id: 'f2-5', name: 'Alejandro Moisés Rubio Medina', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0412-1052372', docId: 'V-29.539.180' },
  { id: 'f2-6', name: 'Yorvi José Sierra López', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0412-0698387', docId: 'V-26.541.702' },
  { id: 'f2-7', name: 'José Miguel Sierra Nava', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0424-6328714', docId: 'V-33.597.264' },
  { id: 'f2-8', name: 'Osmán José Vargas Quintero', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0412-7330508', docId: 'V-31.055.024' },
  { id: 'f2-9', name: 'Julio César Yajure Sánchez', stage: '2° de Filosofía', diocese: 'Maracaibo', phone: '0412-6713820', docId: 'V-30.573.428' },

  // 1° DE FILOSOFÍA (8)
  { id: 'f1-1', name: 'Ángel David Báez Caridad', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0422-6755714', docId: 'V-33.124.924' },
  { id: 'f1-2', name: 'José Enrique Bermúdez Suárez', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0412-4250224', docId: 'V-32.577.396' },
  { id: 'f1-3', name: 'Edwin Javier Bermúdez Urdaneta', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0412-6989201', docId: 'V-32.551.085' },
  { id: 'f1-4', name: 'Lisandro Alberto Castellano Finol', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0424-6065923', docId: 'V-30.274.453' },
  { id: 'f1-5', name: 'Roberth David García Marín', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0424-6576662', docId: 'V-32.967.515' },
  { id: 'f1-6', name: 'Miguel Rafael Márquez Barreto', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0422-7173463', docId: 'V-32.098.189' },
  { id: 'f1-7', name: 'Isaac David Pérez Ramos', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0424-6633777', docId: 'V-31.818.380' },
  { id: 'f1-8', name: 'Samuel de Jesús Pérez Ramos', stage: '1° de Filosofía', diocese: 'Maracaibo', phone: '0412-5131419', docId: 'V-33.036.016' }
];

export const SEMINARY_STAGES = [
  '4° de Teología',
  '3° de Teología',
  '2° de Teología',
  '1° de Teología',
  '3° de Filosofía',
  '2° de Filosofía',
  '1° de Filosofía',
  'Etapa Propedéutica'
] as const;
