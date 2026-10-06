// ==========================================================================
// ByteFix · main.js
// Funciones de la página: JS-1 a JS-7 (agente.md, 7.6) y el filtro del
// catálogo (RF-13). Se carga con defer después de bootstrap.bundle.min.js.
// Mejora progresiva: si este archivo falla, el contenido sigue visible.
// ==========================================================================

// Número y texto base de WhatsApp (F2, D-04). "vi su página" mide la meta I6.
// Copia publicada (D-26): sin número; WhatsApp abre el mensaje listo y la persona elige el contacto.
const NUMERO_WHATSAPP = '';
const MENSAJE_BASE = 'Hola ByteFix, vi su página y quiero cotizar';

// Textos de las insignias de estado de las promociones (RF-14)
const TEXTOS_ESTADO = {
  vigente: 'Vigente',
  proximamente: 'Próximamente',
  vencida: 'Vencida',
};

// Reglas de validación del formulario (Fase 2, sección 4.6)
const REGLAS_FORMULARIO = [
  {
    id: 'campo-nombre',
    valida: (valor) => /^[\p{L}][\p{L} '.-]{1,59}$/u.test(valor.trim()),
    mensaje: 'Escribe tu nombre (mínimo 2 letras).',
  },
  {
    id: 'campo-whatsapp',
    valida: (valor) => /^\d{10}$/.test(soloDigitosNacionales(valor)),
    mensaje: 'Escribe tu WhatsApp a 10 dígitos, por ejemplo 238 000 0000.',
  },
  {
    id: 'campo-equipo',
    valida: (valor) => valor !== '',
    mensaje: 'Elige el tipo de equipo.',
  },
  {
    id: 'campo-servicio',
    valida: (valor) => valor !== '',
    mensaje: 'Elige un servicio o la opción de diagnóstico.',
  },
  {
    id: 'campo-problema',
    valida: (valor) => valor.trim().length >= 10 && valor.trim().length <= 500,
    mensaje: 'Cuéntanos qué le pasa a tu equipo (mínimo 10 caracteres).',
  },
];

/** Deja solo los dígitos del teléfono y quita la clave de país 52 si viene incluida. */
function soloDigitosNacionales(valor) {
  const digitos = valor.replace(/\D/g, '');
  return digitos.length === 12 && digitos.startsWith('52') ? digitos.slice(2) : digitos;
}

/** Devuelve el enlace de WhatsApp con el texto codificado. */
function crearEnlaceWhatsApp(texto) {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

/** Crea un ícono SVG decorativo del sprite de la página, oculto para lectores de pantalla (D-25). */
function crearIcono(nombre) {
  const NS = 'http://www.w3.org/2000/svg';
  const icono = document.createElementNS(NS, 'svg');
  const uso = document.createElementNS(NS, 'use');
  icono.setAttribute('class', 'icono');
  icono.setAttribute('aria-hidden', 'true');
  uso.setAttribute('href', `#icono-${nombre}`);
  icono.appendChild(uso);
  return icono;
}

/** Fecha local en formato AAAA-MM-DD, para compararla con las vigencias. */
function fechaLocalISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// ===== Mejora progresiva: cerrar el acordeón que el HTML trae abierto =====
function compactarAcordeon() {
  document.querySelectorAll('.acordeon-info .accordion-collapse.show').forEach((panel) => {
    panel.classList.remove('show');
    const boton = document.querySelector(`[data-bs-target="#${panel.id}"]`);
    if (boton) {
      boton.classList.add('collapsed');
      boton.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== JS-1: cerrar el menú móvil al elegir una opción =====
function cerrarMenuAlNavegar() {
  const menu = document.getElementById('menu-principal');
  const boton = document.querySelector('.boton-menu');
  if (!menu || !boton || typeof bootstrap === 'undefined') {
    return;
  }

  const colapso = bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false });
  menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
      if (!menu.classList.contains('show')) {
        return;
      }
      const destino = enlace.getAttribute('href');
      if (!destino.startsWith('#')) {
        colapso.hide();
        return;
      }
      // Primero se cierra el menú y después se navega: si se navega con el menú
      // abierto, al cerrarse la página se recorre y el título queda oculto (C-05)
      evento.preventDefault();
      menu.addEventListener('hidden.bs.collapse', () => {
        if (window.location.hash === destino) {
          document.querySelector(destino).scrollIntoView();
        } else {
          window.location.hash = destino;
        }
      }, { once: true });
      colapso.hide();
    });
  });

  // El nombre del botón dice lo que hará al tocarlo
  menu.addEventListener('shown.bs.collapse', () => boton.setAttribute('aria-label', 'Cerrar menú'));
  menu.addEventListener('hidden.bs.collapse', () => boton.setAttribute('aria-label', 'Abrir menú'));
}

// ===== JS-2: resaltar en el menú la sección activa (ScrollSpy) =====
function activarScrollSpy() {
  const menu = document.getElementById('menu-principal');
  if (!menu || typeof bootstrap === 'undefined') {
    return;
  }

  bootstrap.ScrollSpy.getOrCreateInstance(document.body, { target: '#menu-principal' });

  // Además de la clase .active, se marca aria-current para lectores de pantalla
  document.body.addEventListener('activate.bs.scrollspy', (evento) => {
    menu.querySelectorAll('.nav-link').forEach((enlace) => {
      if (enlace === evento.relatedTarget) {
        enlace.setAttribute('aria-current', 'location');
      } else {
        enlace.removeAttribute('aria-current');
      }
    });
  });
}

// ===== JS-3: validar el formulario de cotización =====
/** Muestra el error de un campo con texto e ícono (no solo con color). */
function mostrarError(campo, mensaje) {
  const error = document.getElementById(`error-${campo.id.replace('campo-', '')}`);
  campo.setAttribute('aria-invalid', 'true');
  if (error) {
    error.replaceChildren(crearIcono('exclamation-circle'), document.createTextNode(` ${mensaje}`));
  }
}

/** Quita el error de un campo. */
function limpiarError(campo) {
  const error = document.getElementById(`error-${campo.id.replace('campo-', '')}`);
  campo.removeAttribute('aria-invalid');
  if (error) {
    error.replaceChildren();
  }
}

/** Valida un campo con su regla; devuelve true si es válido. */
function validarCampo(regla) {
  const campo = document.getElementById(regla.id);
  if (!campo) {
    return true;
  }
  if (regla.valida(campo.value)) {
    limpiarError(campo);
    return true;
  }
  mostrarError(campo, regla.mensaje);
  return false;
}

function validarFormularioCotizacion() {
  const formulario = document.getElementById('formulario-cotizacion');
  if (!formulario) {
    return;
  }

  // Al corregir un campo con error, el mensaje se actualiza en el momento
  REGLAS_FORMULARIO.forEach((regla) => {
    const campo = document.getElementById(regla.id);
    if (!campo) {
      return;
    }
    const revisar = () => {
      if (campo.getAttribute('aria-invalid') === 'true') {
        validarCampo(regla);
      }
    };
    campo.addEventListener('input', revisar);
    campo.addEventListener('change', revisar);
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const invalidas = REGLAS_FORMULARIO.filter((regla) => !validarCampo(regla));
    const confirmacion = document.getElementById('confirmacion-formulario');

    if (invalidas.length > 0) {
      if (confirmacion) {
        confirmacion.replaceChildren();
      }
      document.getElementById(invalidas[0].id).focus();
      return;
    }
    armarMensajeWhatsApp(formulario);
  });
}

/** Arma el mensaje con los datos, abre WhatsApp y muestra la confirmación (RF-12, D-18). */
function armarMensajeWhatsApp(formulario) {
  const valor = (id) => document.getElementById(id).value.trim();
  const textoOpcion = (id) => {
    const lista = document.getElementById(id);
    return lista.options[lista.selectedIndex].text;
  };
  const nombre = valor('campo-nombre');

  const texto = [
    `${MENSAJE_BASE}.`,
    `Nombre: ${nombre}`,
    `WhatsApp: ${valor('campo-whatsapp')}`,
    `Equipo: ${textoOpcion('campo-equipo')}`,
    `Servicio: ${textoOpcion('campo-servicio')}`,
    `Problema: ${valor('campo-problema')}`,
  ].join('\n');
  const enlace = crearEnlaceWhatsApp(texto);

  // Se abre sin dejar acceso a esta página (equivale a rel="noopener")
  const ventana = window.open(enlace, '_blank');
  if (ventana) {
    ventana.opener = null;
  }

  // La confirmación recuerda que falta tocar "enviar" en WhatsApp
  const confirmacion = document.getElementById('confirmacion-formulario');
  if (!confirmacion) {
    return;
  }
  const respaldo = document.createElement('a');
  respaldo.href = enlace;
  respaldo.target = '_blank';
  respaldo.rel = 'noopener';
  respaldo.textContent = 'ábrelo aquí (se abre en otra pestaña)';

  const primerNombre = nombre.split(' ')[0];
  confirmacion.replaceChildren(
    crearIcono('check-circle'),
    document.createTextNode(` ¡Listo, ${primerNombre}! Se abrió WhatsApp con tu mensaje: solo dale enviar y te respondemos en horario de taller. Si no se abrió, `),
    respaldo,
    document.createTextNode('.'),
  );
  formulario.dataset.enviado = 'true';
}

// ===== JS-4: ampliar imágenes de la galería en un modal =====
function abrirImagenEnModal() {
  const modal = document.getElementById('modal-galeria');
  const enlaces = document.querySelectorAll('.enlace-galeria');
  if (!modal || enlaces.length === 0 || typeof bootstrap === 'undefined') {
    return;
  }

  const instancia = bootstrap.Modal.getOrCreateInstance(modal);
  const imagen = modal.querySelector('.imagen-modal');
  const titulo = modal.querySelector('.modal-title');
  const credito = modal.querySelector('.credito-modal');
  let enlaceActivo = null;

  enlaces.forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
      evento.preventDefault();
      const miniatura = enlace.querySelector('img');
      if (imagen && miniatura) {
        imagen.src = enlace.href;
        imagen.alt = miniatura.alt;
      }
      if (titulo) {
        titulo.textContent = enlace.dataset.titulo || 'Imagen de la galería';
      }
      if (credito) {
        credito.textContent = enlace.dataset.credito || '';
      }
      enlaceActivo = enlace;
      instancia.show(enlace);
    });
  });

  // Al cerrar, el foco regresa a la foto que se abrió (control y libertad)
  modal.addEventListener('hidden.bs.modal', () => {
    if (enlaceActivo) {
      enlaceActivo.focus();
    }
  });
}

// ===== JS-5: año actual automático en el pie =====
function ponerAnioActual() {
  const anio = document.getElementById('anio-actual');
  if (anio) {
    anio.textContent = String(new Date().getFullYear());
  }
}

// ===== JS-6: botón "volver arriba" =====
function controlarBotonVolverArriba() {
  const boton = document.querySelector('.boton-volver-arriba');
  const logo = document.querySelector('.navbar-brand');
  if (!boton) {
    return;
  }

  // Aparece después de bajar una pantalla completa
  const actualizar = () => {
    boton.hidden = window.scrollY < window.innerHeight;
  };
  window.addEventListener('scroll', actualizar, { passive: true });
  actualizar();

  boton.addEventListener('click', () => {
    window.scrollTo({ top: 0 });
    if (logo) {
      logo.focus({ preventScroll: true });
    }
  });
}

// ===== JS-7: marcar el estado de las promociones según la fecha =====
function marcarEstadoPromociones() {
  const hoy = fechaLocalISO(new Date());

  document.querySelectorAll('.tarjeta-promocion').forEach((tarjeta) => {
    const { inicio, fin } = tarjeta.dataset;
    let estado = 'vigente';
    if (inicio && hoy < inicio) {
      estado = 'proximamente';
    } else if (fin && hoy > fin) {
      estado = 'vencida';
    }

    const insignia = tarjeta.querySelector('.estado-promocion');
    if (insignia) {
      insignia.textContent = TEXTOS_ESTADO[estado];
      insignia.className = `badge estado-promocion estado-${estado}`;
    }
    tarjeta.classList.toggle('promocion-vencida', estado === 'vencida');
  });
}

// ===== RF-13: filtrar el catálogo por categoría =====
function filtrarCatalogo() {
  const filtro = document.querySelector('.filtro-catalogo');
  const categorias = document.querySelectorAll('.categoria-catalogo');
  const contador = document.querySelector('.contador-servicios');
  if (!filtro || categorias.length === 0) {
    return;
  }

  // El filtro solo se muestra cuando JavaScript funciona
  filtro.hidden = false;
  const botones = filtro.querySelectorAll('[data-filtro]');

  const aplicar = (valor) => {
    let total = 0;
    categorias.forEach((categoria) => {
      const visible = valor === 'todos' || categoria.dataset.categoria === valor;
      categoria.hidden = !visible;
      if (visible) {
        total += categoria.querySelectorAll('.tarjeta-servicio').length;
      }
    });
    botones.forEach((boton) => {
      boton.setAttribute('aria-pressed', String(boton.dataset.filtro === valor));
    });
    if (contador) {
      contador.hidden = false;
      contador.textContent = total === 1
        ? 'Se muestra 1 servicio o producto.'
        : `Se muestran ${total} servicios y productos.`;
    }
  };

  botones.forEach((boton) => {
    boton.addEventListener('click', () => aplicar(boton.dataset.filtro));
  });
  aplicar('todos');
}

// ===== Inicio: se ejecuta cuando el HTML está listo =====
document.addEventListener('DOMContentLoaded', () => {
  compactarAcordeon();
  cerrarMenuAlNavegar();
  activarScrollSpy();
  validarFormularioCotizacion();
  abrirImagenEnModal();
  ponerAnioActual();
  controlarBotonVolverArriba();
  marcarEstadoPromociones();
  filtrarCatalogo();
});
