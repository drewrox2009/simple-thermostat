!(function () {
  const e = { DEBUG: !1 }
  try {
    if (process)
      return (
        (process.env = Object.assign({}, process.env)),
        void Object.assign(process.env, e)
      )
  } catch (e) {}
  globalThis.process = { env: e }
})()
var e = 'simple-thermostat-refresh'
const t =
    'undefined' != typeof window &&
    null != window.customElements &&
    void 0 !== window.customElements.polyfillWrapFlushCallback,
  i = (e, t, i = null) => {
    for (; t !== i; ) {
      const i = t.nextSibling
      e.removeChild(t), (t = i)
    }
  },
  n = `{{lit-${String(Math.random()).slice(2)}}}`,
  s = `\x3c!--${n}--\x3e`,
  o = new RegExp(`${n}|${s}`)
class r {
  constructor(e, t) {
    ;(this.parts = []), (this.element = t)
    const i = [],
      s = [],
      r = document.createTreeWalker(t.content, 133, null, !1)
    let l = 0,
      h = -1,
      u = 0
    const {
      strings: p,
      values: { length: f },
    } = e
    for (; u < f; ) {
      const e = r.nextNode()
      if (null !== e) {
        if ((h++, 1 === e.nodeType)) {
          if (e.hasAttributes()) {
            const t = e.attributes,
              { length: i } = t
            let n = 0
            for (let e = 0; e < i; e++) a(t[e].name, '$lit$') && n++
            for (; n-- > 0; ) {
              const t = p[u],
                i = d.exec(t)[2],
                n = i.toLowerCase() + '$lit$',
                s = e.getAttribute(n)
              e.removeAttribute(n)
              const r = s.split(o)
              this.parts.push({
                type: 'attribute',
                index: h,
                name: i,
                strings: r,
              }),
                (u += r.length - 1)
            }
          }
          'TEMPLATE' === e.tagName && (s.push(e), (r.currentNode = e.content))
        } else if (3 === e.nodeType) {
          const t = e.data
          if (t.indexOf(n) >= 0) {
            const n = e.parentNode,
              s = t.split(o),
              r = s.length - 1
            for (let t = 0; t < r; t++) {
              let i,
                o = s[t]
              if ('' === o) i = c()
              else {
                const e = d.exec(o)
                null !== e &&
                  a(e[2], '$lit$') &&
                  (o =
                    o.slice(0, e.index) +
                    e[1] +
                    e[2].slice(0, -'$lit$'.length) +
                    e[3]),
                  (i = document.createTextNode(o))
              }
              n.insertBefore(i, e),
                this.parts.push({ type: 'node', index: ++h })
            }
            '' === s[r] ? (n.insertBefore(c(), e), i.push(e)) : (e.data = s[r]),
              (u += r)
          }
        } else if (8 === e.nodeType)
          if (e.data === n) {
            const t = e.parentNode
            ;(null !== e.previousSibling && h !== l) ||
              (h++, t.insertBefore(c(), e)),
              (l = h),
              this.parts.push({ type: 'node', index: h }),
              null === e.nextSibling ? (e.data = '') : (i.push(e), h--),
              u++
          } else {
            let t = -1
            for (; -1 !== (t = e.data.indexOf(n, t + 1)); )
              this.parts.push({ type: 'node', index: -1 }), u++
          }
      } else r.currentNode = s.pop()
    }
    for (const e of i) e.parentNode.removeChild(e)
  }
}
const a = (e, t) => {
    const i = e.length - t.length
    return i >= 0 && e.slice(i) === t
  },
  l = (e) => -1 !== e.index,
  c = () => document.createComment(''),
  d = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/
function h(e, t) {
  const {
      element: { content: i },
      parts: n,
    } = e,
    s = document.createTreeWalker(i, 133, null, !1)
  let o = p(n),
    r = n[o],
    a = -1,
    l = 0
  const c = []
  let d = null
  for (; s.nextNode(); ) {
    a++
    const e = s.currentNode
    for (
      e.previousSibling === d && (d = null),
        t.has(e) && (c.push(e), null === d && (d = e)),
        null !== d && l++;
      void 0 !== r && r.index === a;

    )
      (r.index = null !== d ? -1 : r.index - l), (o = p(n, o)), (r = n[o])
  }
  c.forEach((e) => e.parentNode.removeChild(e))
}
const u = (e) => {
    let t = 11 === e.nodeType ? 0 : 1
    const i = document.createTreeWalker(e, 133, null, !1)
    for (; i.nextNode(); ) t++
    return t
  },
  p = (e, t = -1) => {
    for (let i = t + 1; i < e.length; i++) {
      const t = e[i]
      if (l(t)) return i
    }
    return -1
  }
const f = new WeakMap(),
  g = (e) => 'function' == typeof e && f.has(e),
  m = {},
  v = {}
class y {
  constructor(e, t, i) {
    ;(this.__parts = []),
      (this.template = e),
      (this.processor = t),
      (this.options = i)
  }
  update(e) {
    let t = 0
    for (const i of this.__parts) void 0 !== i && i.setValue(e[t]), t++
    for (const e of this.__parts) void 0 !== e && e.commit()
  }
  _clone() {
    const e = t
        ? this.template.element.content.cloneNode(!0)
        : document.importNode(this.template.element.content, !0),
      i = [],
      n = this.template.parts,
      s = document.createTreeWalker(e, 133, null, !1)
    let o,
      r = 0,
      a = 0,
      c = s.nextNode()
    for (; r < n.length; )
      if (((o = n[r]), l(o))) {
        for (; a < o.index; )
          a++,
            'TEMPLATE' === c.nodeName &&
              (i.push(c), (s.currentNode = c.content)),
            null === (c = s.nextNode()) &&
              ((s.currentNode = i.pop()), (c = s.nextNode()))
        if ('node' === o.type) {
          const e = this.processor.handleTextExpression(this.options)
          e.insertAfterNode(c.previousSibling), this.__parts.push(e)
        } else
          this.__parts.push(
            ...this.processor.handleAttributeExpressions(
              c,
              o.name,
              o.strings,
              this.options
            )
          )
        r++
      } else this.__parts.push(void 0), r++
    return t && (document.adoptNode(e), customElements.upgrade(e)), e
  }
}
const b =
    window.trustedTypes &&
    trustedTypes.createPolicy('lit-html', { createHTML: (e) => e }),
  _ = ` ${n} `
class w {
  constructor(e, t, i, n) {
    ;(this.strings = e),
      (this.values = t),
      (this.type = i),
      (this.processor = n)
  }
  getHTML() {
    const e = this.strings.length - 1
    let t = '',
      i = !1
    for (let o = 0; o < e; o++) {
      const e = this.strings[o],
        r = e.lastIndexOf('\x3c!--')
      i = (r > -1 || i) && -1 === e.indexOf('--\x3e', r + 1)
      const a = d.exec(e)
      t +=
        null === a
          ? e + (i ? _ : s)
          : e.substr(0, a.index) + a[1] + a[2] + '$lit$' + a[3] + n
    }
    return (t += this.strings[e]), t
  }
  getTemplateElement() {
    const e = document.createElement('template')
    let t = this.getHTML()
    return void 0 !== b && (t = b.createHTML(t)), (e.innerHTML = t), e
  }
}
const x = (e) =>
    null === e || !('object' == typeof e || 'function' == typeof e),
  S = (e) => Array.isArray(e) || !(!e || !e[Symbol.iterator])
class $ {
  constructor(e, t, i) {
    ;(this.dirty = !0),
      (this.element = e),
      (this.name = t),
      (this.strings = i),
      (this.parts = [])
    for (let e = 0; e < i.length - 1; e++) this.parts[e] = this._createPart()
  }
  _createPart() {
    return new k(this)
  }
  _getValue() {
    const e = this.strings,
      t = e.length - 1,
      i = this.parts
    if (1 === t && '' === e[0] && '' === e[1]) {
      const e = i[0].value
      if ('symbol' == typeof e) return String(e)
      if ('string' == typeof e || !S(e)) return e
    }
    let n = ''
    for (let s = 0; s < t; s++) {
      n += e[s]
      const t = i[s]
      if (void 0 !== t) {
        const e = t.value
        if (x(e) || !S(e)) n += 'string' == typeof e ? e : String(e)
        else for (const t of e) n += 'string' == typeof t ? t : String(t)
      }
    }
    return (n += e[t]), n
  }
  commit() {
    this.dirty &&
      ((this.dirty = !1),
      this.element.setAttribute(this.name, this._getValue()))
  }
}
class k {
  constructor(e) {
    ;(this.value = void 0), (this.committer = e)
  }
  setValue(e) {
    e === m ||
      (x(e) && e === this.value) ||
      ((this.value = e), g(e) || (this.committer.dirty = !0))
  }
  commit() {
    for (; g(this.value); ) {
      const e = this.value
      ;(this.value = m), e(this)
    }
    this.value !== m && this.committer.commit()
  }
}
class P {
  constructor(e) {
    ;(this.value = void 0), (this.__pendingValue = void 0), (this.options = e)
  }
  appendInto(e) {
    ;(this.startNode = e.appendChild(c())), (this.endNode = e.appendChild(c()))
  }
  insertAfterNode(e) {
    ;(this.startNode = e), (this.endNode = e.nextSibling)
  }
  appendIntoPart(e) {
    e.__insert((this.startNode = c())), e.__insert((this.endNode = c()))
  }
  insertAfterPart(e) {
    e.__insert((this.startNode = c())),
      (this.endNode = e.endNode),
      (e.endNode = this.startNode)
  }
  setValue(e) {
    this.__pendingValue = e
  }
  commit() {
    if (null === this.startNode.parentNode) return
    for (; g(this.__pendingValue); ) {
      const e = this.__pendingValue
      ;(this.__pendingValue = m), e(this)
    }
    const e = this.__pendingValue
    e !== m &&
      (x(e)
        ? e !== this.value && this.__commitText(e)
        : e instanceof w
        ? this.__commitTemplateResult(e)
        : e instanceof Node
        ? this.__commitNode(e)
        : S(e)
        ? this.__commitIterable(e)
        : e === v
        ? ((this.value = v), this.clear())
        : this.__commitText(e))
  }
  __insert(e) {
    this.endNode.parentNode.insertBefore(e, this.endNode)
  }
  __commitNode(e) {
    this.value !== e && (this.clear(), this.__insert(e), (this.value = e))
  }
  __commitText(e) {
    const t = this.startNode.nextSibling,
      i = 'string' == typeof (e = null == e ? '' : e) ? e : String(e)
    t === this.endNode.previousSibling && 3 === t.nodeType
      ? (t.data = i)
      : this.__commitNode(document.createTextNode(i)),
      (this.value = e)
  }
  __commitTemplateResult(e) {
    const t = this.options.templateFactory(e)
    if (this.value instanceof y && this.value.template === t)
      this.value.update(e.values)
    else {
      const i = new y(t, e.processor, this.options),
        n = i._clone()
      i.update(e.values), this.__commitNode(n), (this.value = i)
    }
  }
  __commitIterable(e) {
    Array.isArray(this.value) || ((this.value = []), this.clear())
    const t = this.value
    let i,
      n = 0
    for (const s of e)
      (i = t[n]),
        void 0 === i &&
          ((i = new P(this.options)),
          t.push(i),
          0 === n ? i.appendIntoPart(this) : i.insertAfterPart(t[n - 1])),
        i.setValue(s),
        i.commit(),
        n++
    n < t.length && ((t.length = n), this.clear(i && i.endNode))
  }
  clear(e = this.startNode) {
    i(this.startNode.parentNode, e.nextSibling, this.endNode)
  }
}
class O {
  constructor(e, t, i) {
    if (
      ((this.value = void 0),
      (this.__pendingValue = void 0),
      2 !== i.length || '' !== i[0] || '' !== i[1])
    )
      throw new Error('Boolean attributes can only contain a single expression')
    ;(this.element = e), (this.name = t), (this.strings = i)
  }
  setValue(e) {
    this.__pendingValue = e
  }
  commit() {
    for (; g(this.__pendingValue); ) {
      const e = this.__pendingValue
      ;(this.__pendingValue = m), e(this)
    }
    if (this.__pendingValue === m) return
    const e = !!this.__pendingValue
    this.value !== e &&
      (e
        ? this.element.setAttribute(this.name, '')
        : this.element.removeAttribute(this.name),
      (this.value = e)),
      (this.__pendingValue = m)
  }
}
class C extends $ {
  constructor(e, t, i) {
    super(e, t, i), (this.single = 2 === i.length && '' === i[0] && '' === i[1])
  }
  _createPart() {
    return new E(this)
  }
  _getValue() {
    return this.single ? this.parts[0].value : super._getValue()
  }
  commit() {
    this.dirty &&
      ((this.dirty = !1), (this.element[this.name] = this._getValue()))
  }
}
class E extends k {}
let j = !1
;(() => {
  try {
    const e = {
      get capture() {
        return (j = !0), !1
      },
    }
    window.addEventListener('test', e, e),
      window.removeEventListener('test', e, e)
  } catch (e) {}
})()
class N {
  constructor(e, t, i) {
    ;(this.value = void 0),
      (this.__pendingValue = void 0),
      (this.element = e),
      (this.eventName = t),
      (this.eventContext = i),
      (this.__boundHandleEvent = (e) => this.handleEvent(e))
  }
  setValue(e) {
    this.__pendingValue = e
  }
  commit() {
    for (; g(this.__pendingValue); ) {
      const e = this.__pendingValue
      ;(this.__pendingValue = m), e(this)
    }
    if (this.__pendingValue === m) return
    const e = this.__pendingValue,
      t = this.value,
      i =
        null == e ||
        (null != t &&
          (e.capture !== t.capture ||
            e.once !== t.once ||
            e.passive !== t.passive)),
      n = null != e && (null == t || i)
    i &&
      this.element.removeEventListener(
        this.eventName,
        this.__boundHandleEvent,
        this.__options
      ),
      n &&
        ((this.__options = T(e)),
        this.element.addEventListener(
          this.eventName,
          this.__boundHandleEvent,
          this.__options
        )),
      (this.value = e),
      (this.__pendingValue = m)
  }
  handleEvent(e) {
    'function' == typeof this.value
      ? this.value.call(this.eventContext || this.element, e)
      : this.value.handleEvent(e)
  }
}
const T = (e) =>
  e &&
  (j ? { capture: e.capture, passive: e.passive, once: e.once } : e.capture)
function A(e) {
  let t = z.get(e.type)
  void 0 === t &&
    ((t = { stringsArray: new WeakMap(), keyString: new Map() }),
    z.set(e.type, t))
  let i = t.stringsArray.get(e.strings)
  if (void 0 !== i) return i
  const s = e.strings.join(n)
  return (
    (i = t.keyString.get(s)),
    void 0 === i &&
      ((i = new r(e, e.getTemplateElement())), t.keyString.set(s, i)),
    t.stringsArray.set(e.strings, i),
    i
  )
}
const z = new Map(),
  V = new WeakMap()
const R = new (class {
  handleAttributeExpressions(e, t, i, n) {
    const s = t[0]
    if ('.' === s) {
      return new C(e, t.slice(1), i).parts
    }
    if ('@' === s) return [new N(e, t.slice(1), n.eventContext)]
    if ('?' === s) return [new O(e, t.slice(1), i)]
    return new $(e, t, i).parts
  }
  handleTextExpression(e) {
    return new P(e)
  }
})()
'undefined' != typeof window &&
  (window.litHtmlVersions || (window.litHtmlVersions = [])).push('1.3.0')
const I = (e, ...t) => new w(e, t, 'html', R),
  M = (e, t) => `${e}--${t}`
let U = !0
void 0 === window.ShadyCSS
  ? (U = !1)
  : void 0 === window.ShadyCSS.prepareTemplateDom &&
    (console.warn(
      'Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1.'
    ),
    (U = !1))
const F = (e) => (t) => {
    const i = M(t.type, e)
    let s = z.get(i)
    void 0 === s &&
      ((s = { stringsArray: new WeakMap(), keyString: new Map() }), z.set(i, s))
    let o = s.stringsArray.get(t.strings)
    if (void 0 !== o) return o
    const a = t.strings.join(n)
    if (((o = s.keyString.get(a)), void 0 === o)) {
      const i = t.getTemplateElement()
      U && window.ShadyCSS.prepareTemplateDom(i, e),
        (o = new r(t, i)),
        s.keyString.set(a, o)
    }
    return s.stringsArray.set(t.strings, o), o
  },
  H = ['html', 'svg'],
  L = new Set(),
  q = (e, t, i) => {
    L.add(e)
    const n = i ? i.element : document.createElement('template'),
      s = t.querySelectorAll('style'),
      { length: o } = s
    if (0 === o) return void window.ShadyCSS.prepareTemplateStyles(n, e)
    const r = document.createElement('style')
    for (let e = 0; e < o; e++) {
      const t = s[e]
      t.parentNode.removeChild(t), (r.textContent += t.textContent)
    }
    ;((e) => {
      H.forEach((t) => {
        const i = z.get(M(t, e))
        void 0 !== i &&
          i.keyString.forEach((e) => {
            const {
                element: { content: t },
              } = e,
              i = new Set()
            Array.from(t.querySelectorAll('style')).forEach((e) => {
              i.add(e)
            }),
              h(e, i)
          })
      })
    })(e)
    const a = n.content
    i
      ? (function (e, t, i = null) {
          const {
            element: { content: n },
            parts: s,
          } = e
          if (null == i) return void n.appendChild(t)
          const o = document.createTreeWalker(n, 133, null, !1)
          let r = p(s),
            a = 0,
            l = -1
          for (; o.nextNode(); )
            for (
              l++,
                o.currentNode === i &&
                  ((a = u(t)), i.parentNode.insertBefore(t, i));
              -1 !== r && s[r].index === l;

            ) {
              if (a > 0) {
                for (; -1 !== r; ) (s[r].index += a), (r = p(s, r))
                return
              }
              r = p(s, r)
            }
        })(i, r, a.firstChild)
      : a.insertBefore(r, a.firstChild),
      window.ShadyCSS.prepareTemplateStyles(n, e)
    const l = a.querySelector('style')
    if (window.ShadyCSS.nativeShadow && null !== l)
      t.insertBefore(l.cloneNode(!0), t.firstChild)
    else if (i) {
      a.insertBefore(r, a.firstChild)
      const e = new Set()
      e.add(r), h(i, e)
    }
  }
window.JSCompiler_renameProperty = (e, t) => e
const B = {
    toAttribute(e, t) {
      switch (t) {
        case Boolean:
          return e ? '' : null
        case Object:
        case Array:
          return null == e ? e : JSON.stringify(e)
      }
      return e
    },
    fromAttribute(e, t) {
      switch (t) {
        case Boolean:
          return null !== e
        case Number:
          return null === e ? null : Number(e)
        case Object:
        case Array:
          return JSON.parse(e)
      }
      return e
    },
  },
  D = (e, t) => t !== e && (t == t || e == e),
  W = { attribute: !0, type: String, converter: B, reflect: !1, hasChanged: D }
class J extends HTMLElement {
  constructor() {
    super(), this.initialize()
  }
  static get observedAttributes() {
    this.finalize()
    const e = []
    return (
      this._classProperties.forEach((t, i) => {
        const n = this._attributeNameForProperty(i, t)
        void 0 !== n && (this._attributeToPropertyMap.set(n, i), e.push(n))
      }),
      e
    )
  }
  static _ensureClassProperties() {
    if (
      !this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))
    ) {
      this._classProperties = new Map()
      const e = Object.getPrototypeOf(this)._classProperties
      void 0 !== e && e.forEach((e, t) => this._classProperties.set(t, e))
    }
  }
  static createProperty(e, t = W) {
    if (
      (this._ensureClassProperties(),
      this._classProperties.set(e, t),
      t.noAccessor || this.prototype.hasOwnProperty(e))
    )
      return
    const i = 'symbol' == typeof e ? Symbol() : `__${e}`,
      n = this.getPropertyDescriptor(e, i, t)
    void 0 !== n && Object.defineProperty(this.prototype, e, n)
  }
  static getPropertyDescriptor(e, t, i) {
    return {
      get() {
        return this[t]
      },
      set(n) {
        const s = this[e]
        ;(this[t] = n), this.requestUpdateInternal(e, s, i)
      },
      configurable: !0,
      enumerable: !0,
    }
  }
  static getPropertyOptions(e) {
    return (this._classProperties && this._classProperties.get(e)) || W
  }
  static finalize() {
    const e = Object.getPrototypeOf(this)
    if (
      (e.hasOwnProperty('finalized') || e.finalize(),
      (this.finalized = !0),
      this._ensureClassProperties(),
      (this._attributeToPropertyMap = new Map()),
      this.hasOwnProperty(JSCompiler_renameProperty('properties', this)))
    ) {
      const e = this.properties,
        t = [
          ...Object.getOwnPropertyNames(e),
          ...('function' == typeof Object.getOwnPropertySymbols
            ? Object.getOwnPropertySymbols(e)
            : []),
        ]
      for (const i of t) this.createProperty(i, e[i])
    }
  }
  static _attributeNameForProperty(e, t) {
    const i = t.attribute
    return !1 === i
      ? void 0
      : 'string' == typeof i
      ? i
      : 'string' == typeof e
      ? e.toLowerCase()
      : void 0
  }
  static _valueHasChanged(e, t, i = D) {
    return i(e, t)
  }
  static _propertyValueFromAttribute(e, t) {
    const i = t.type,
      n = t.converter || B,
      s = 'function' == typeof n ? n : n.fromAttribute
    return s ? s(e, i) : e
  }
  static _propertyValueToAttribute(e, t) {
    if (void 0 === t.reflect) return
    const i = t.type,
      n = t.converter
    return ((n && n.toAttribute) || B.toAttribute)(e, i)
  }
  initialize() {
    ;(this._updateState = 0),
      (this._updatePromise = new Promise(
        (e) => (this._enableUpdatingResolver = e)
      )),
      (this._changedProperties = new Map()),
      this._saveInstanceProperties(),
      this.requestUpdateInternal()
  }
  _saveInstanceProperties() {
    this.constructor._classProperties.forEach((e, t) => {
      if (this.hasOwnProperty(t)) {
        const e = this[t]
        delete this[t],
          this._instanceProperties || (this._instanceProperties = new Map()),
          this._instanceProperties.set(t, e)
      }
    })
  }
  _applyInstanceProperties() {
    this._instanceProperties.forEach((e, t) => (this[t] = e)),
      (this._instanceProperties = void 0)
  }
  connectedCallback() {
    this.enableUpdating()
  }
  enableUpdating() {
    void 0 !== this._enableUpdatingResolver &&
      (this._enableUpdatingResolver(), (this._enableUpdatingResolver = void 0))
  }
  disconnectedCallback() {}
  attributeChangedCallback(e, t, i) {
    t !== i && this._attributeToProperty(e, i)
  }
  _propertyToAttribute(e, t, i = W) {
    const n = this.constructor,
      s = n._attributeNameForProperty(e, i)
    if (void 0 !== s) {
      const e = n._propertyValueToAttribute(t, i)
      if (void 0 === e) return
      ;(this._updateState = 8 | this._updateState),
        null == e ? this.removeAttribute(s) : this.setAttribute(s, e),
        (this._updateState = -9 & this._updateState)
    }
  }
  _attributeToProperty(e, t) {
    if (8 & this._updateState) return
    const i = this.constructor,
      n = i._attributeToPropertyMap.get(e)
    if (void 0 !== n) {
      const e = i.getPropertyOptions(n)
      ;(this._updateState = 16 | this._updateState),
        (this[n] = i._propertyValueFromAttribute(t, e)),
        (this._updateState = -17 & this._updateState)
    }
  }
  requestUpdateInternal(e, t, i) {
    let n = !0
    if (void 0 !== e) {
      const s = this.constructor
      ;(i = i || s.getPropertyOptions(e)),
        s._valueHasChanged(this[e], t, i.hasChanged)
          ? (this._changedProperties.has(e) ||
              this._changedProperties.set(e, t),
            !0 !== i.reflect ||
              16 & this._updateState ||
              (void 0 === this._reflectingProperties &&
                (this._reflectingProperties = new Map()),
              this._reflectingProperties.set(e, i)))
          : (n = !1)
    }
    !this._hasRequestedUpdate &&
      n &&
      (this._updatePromise = this._enqueueUpdate())
  }
  requestUpdate(e, t) {
    return this.requestUpdateInternal(e, t), this.updateComplete
  }
  async _enqueueUpdate() {
    this._updateState = 4 | this._updateState
    try {
      await this._updatePromise
    } catch (e) {}
    const e = this.performUpdate()
    return null != e && (await e), !this._hasRequestedUpdate
  }
  get _hasRequestedUpdate() {
    return 4 & this._updateState
  }
  get hasUpdated() {
    return 1 & this._updateState
  }
  performUpdate() {
    if (!this._hasRequestedUpdate) return
    this._instanceProperties && this._applyInstanceProperties()
    let e = !1
    const t = this._changedProperties
    try {
      ;(e = this.shouldUpdate(t)), e ? this.update(t) : this._markUpdated()
    } catch (t) {
      throw ((e = !1), this._markUpdated(), t)
    }
    e &&
      (1 & this._updateState ||
        ((this._updateState = 1 | this._updateState), this.firstUpdated(t)),
      this.updated(t))
  }
  _markUpdated() {
    ;(this._changedProperties = new Map()),
      (this._updateState = -5 & this._updateState)
  }
  get updateComplete() {
    return this._getUpdateComplete()
  }
  _getUpdateComplete() {
    return this._updatePromise
  }
  shouldUpdate(e) {
    return !0
  }
  update(e) {
    void 0 !== this._reflectingProperties &&
      this._reflectingProperties.size > 0 &&
      (this._reflectingProperties.forEach((e, t) =>
        this._propertyToAttribute(t, this[t], e)
      ),
      (this._reflectingProperties = void 0)),
      this._markUpdated()
  }
  updated(e) {}
  firstUpdated(e) {}
}
J.finalized = !0
const G = (e, t) =>
  'method' === t.kind && t.descriptor && !('value' in t.descriptor)
    ? Object.assign(Object.assign({}, t), {
        finisher(i) {
          i.createProperty(t.key, e)
        },
      })
    : {
        kind: 'field',
        key: Symbol(),
        placement: 'own',
        descriptor: {},
        initializer() {
          'function' == typeof t.initializer &&
            (this[t.key] = t.initializer.call(this))
        },
        finisher(i) {
          i.createProperty(t.key, e)
        },
      }
function Y(e) {
  return (t, i) =>
    void 0 !== i
      ? ((e, t, i) => {
          t.constructor.createProperty(i, e)
        })(e, t, i)
      : G(e, t)
}
const K =
    window.ShadowRoot &&
    (void 0 === window.ShadyCSS || window.ShadyCSS.nativeShadow) &&
    'adoptedStyleSheets' in Document.prototype &&
    'replace' in CSSStyleSheet.prototype,
  Q = Symbol()
class X {
  constructor(e, t) {
    if (t !== Q)
      throw new Error(
        'CSSResult is not constructable. Use `unsafeCSS` or `css` instead.'
      )
    this.cssText = e
  }
  get styleSheet() {
    return (
      void 0 === this._styleSheet &&
        (K
          ? ((this._styleSheet = new CSSStyleSheet()),
            this._styleSheet.replaceSync(this.cssText))
          : (this._styleSheet = null)),
      this._styleSheet
    )
  }
  toString() {
    return this.cssText
  }
}
;(window.litElementVersions || (window.litElementVersions = [])).push('2.4.0')
const Z = {}
class ee extends J {
  static getStyles() {
    return this.styles
  }
  static _getUniqueStyles() {
    if (this.hasOwnProperty(JSCompiler_renameProperty('_styles', this))) return
    const e = this.getStyles()
    if (Array.isArray(e)) {
      const t = (e, i) =>
          e.reduceRight(
            (e, i) => (Array.isArray(i) ? t(i, e) : (e.add(i), e)),
            i
          ),
        i = t(e, new Set()),
        n = []
      i.forEach((e) => n.unshift(e)), (this._styles = n)
    } else this._styles = void 0 === e ? [] : [e]
    this._styles = this._styles.map((e) => {
      if (e instanceof CSSStyleSheet && !K) {
        const t = Array.prototype.slice
          .call(e.cssRules)
          .reduce((e, t) => e + t.cssText, '')
        return new X(String(t), Q)
      }
      return e
    })
  }
  initialize() {
    super.initialize(),
      this.constructor._getUniqueStyles(),
      (this.renderRoot = this.createRenderRoot()),
      window.ShadowRoot &&
        this.renderRoot instanceof window.ShadowRoot &&
        this.adoptStyles()
  }
  createRenderRoot() {
    return this.attachShadow({ mode: 'open' })
  }
  adoptStyles() {
    const e = this.constructor._styles
    0 !== e.length &&
      (void 0 === window.ShadyCSS || window.ShadyCSS.nativeShadow
        ? K
          ? (this.renderRoot.adoptedStyleSheets = e.map((e) =>
              e instanceof CSSStyleSheet ? e : e.styleSheet
            ))
          : (this._needsShimAdoptedStyleSheets = !0)
        : window.ShadyCSS.ScopingShim.prepareAdoptedCssText(
            e.map((e) => e.cssText),
            this.localName
          ))
  }
  connectedCallback() {
    super.connectedCallback(),
      this.hasUpdated &&
        void 0 !== window.ShadyCSS &&
        window.ShadyCSS.styleElement(this)
  }
  update(e) {
    const t = this.render()
    super.update(e),
      t !== Z &&
        this.constructor.render(t, this.renderRoot, {
          scopeName: this.localName,
          eventContext: this,
        }),
      this._needsShimAdoptedStyleSheets &&
        ((this._needsShimAdoptedStyleSheets = !1),
        this.constructor._styles.forEach((e) => {
          const t = document.createElement('style')
          ;(t.textContent = e.cssText), this.renderRoot.appendChild(t)
        }))
  }
  render() {
    return Z
  }
}
;(ee.finalized = !0),
  (ee.render = (e, t, n) => {
    if (!n || 'object' != typeof n || !n.scopeName)
      throw new Error('The `scopeName` option is required.')
    const s = n.scopeName,
      o = V.has(t),
      r = U && 11 === t.nodeType && !!t.host,
      a = r && !L.has(s),
      l = a ? document.createDocumentFragment() : t
    if (
      (((e, t, n) => {
        let s = V.get(t)
        void 0 === s &&
          (i(t, t.firstChild),
          V.set(t, (s = new P(Object.assign({ templateFactory: A }, n)))),
          s.appendInto(t)),
          s.setValue(e),
          s.commit()
      })(e, l, Object.assign({ templateFactory: F(s) }, n)),
      a)
    ) {
      const e = V.get(l)
      V.delete(l)
      const n = e.value instanceof y ? e.value.template : void 0
      q(s, l, n), i(t, t.firstChild), t.appendChild(l), V.set(t, e)
    }
    !o && r && window.ShadyCSS.styleElement(t.host)
  })
var te = ((e, ...t) => {
  const i = t.reduce(
    (t, i, n) =>
      t +
      ((e) => {
        if (e instanceof X) return e.cssText
        if ('number' == typeof e) return e
        throw new Error(
          `Value passed to 'css' function must be a 'css' function result: ${e}. Use 'unsafeCSS' to pass non-literal values, but\n            take care to ensure page security.`
        )
      })(i) +
      e[n + 1],
    e[0]
  )
  return new X(i, Q)
})`:host {
  --st-default-spacing: 4px;
}
ha-card {
  -webkit-font-smoothing: var(--paper-font-body1_-_-webkit-font-smoothing);
  font-size: var(--paper-font-body1_-_font-size);
  font-weight: var(--paper-font-body1_-_font-weight);
  line-height: var(--paper-font-body1_-_line-height);

  padding-bottom: calc(var(--st-default-spacing) * 2);

  padding-bottom: calc(var(--st-spacing, var(--st-default-spacing)) * 2);

  border-radius: 16px;

  border-radius: var(--ha-card-border-radius, 16px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  box-shadow: var(--ha-card-box-shadow, 0 4px 16px rgba(0, 0, 0, 0.08));
  overflow: hidden;
  transition: all 0.3s ease-out;

  --auto-color: green;
  --heat_cool-color: springgreen;
  --cool-color: #2b9af9;
  --heat-color: #ff8100;
  --manual-color: #44739e;
  --off-color: #8a8a8a;
  --fan_only-color: #8a8a8a;
  --dry-color: #efbd07;
}

ha-card.no-header {
  padding: calc(var(--st-default-spacing) * 4) 0;
  padding: calc(var(--st-spacing, var(--st-default-spacing)) * 4) 0;
}

.body {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(-webkit-min-content, auto);
  grid-auto-columns: minmax(min-content, auto);
  align-items: center;
  justify-items: center;
  place-items: center;
  padding: 0 calc(var(--st-default-spacing) * 4);
  padding: 0 calc(var(--st-spacing, var(--st-default-spacing)) * 4);
  padding-bottom: calc(var(--st-default-spacing) * 2);
  padding-bottom: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
}

.toggle-label {
  color: var(--primary-text-color);
  color: var(--st-toggle-label-color, var(--primary-text-color));
  margin-right: calc(var(--st-default-spacing) * 2);
  margin-right: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
  font-size: 16px;
  font-size: var(
    --st-font-size-toggle-label,
    var(--paper-font-subhead_-_font-size, 16px)
  );
}

.faults {
  display: flex;
  flex-direction: row;
  margin-left: calc(var(--st-default-spacing) * 2);
  margin-left: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
}
.fault-icon {
  padding: 2px;
  cursor: pointer;
  color: var(--secondary-background-color);
  color: var(--st-fault-inactive-color, var(--secondary-background-color))
}
.fault-icon.active {
    color: var(--accent-color);
    color: var(--st-fault-active-color, var(--accent-color));
  }
.fault-icon.hide {
    display: none;
  }

.sensors {
  display: grid;
  grid-gap: var(--st-default-spacing);
  grid-gap: var(--st-spacing, var(--st-default-spacing));
  font-size: 16px;
  font-size: var(
    --st-font-size-sensors,
    var(--paper-font-subhead_-_font-size, 16px)
  );
}
.sensors.as-list {
  grid-auto-flow: column;
  grid-template-columns: -webkit-min-content;
  grid-template-columns: min-content;
}

.sensors.as-table.without-labels {
    grid: auto-flow / 100%;
    align-items: start;
    justify-items: start;
    place-items: start;
  }

.sensors.as-table.with-labels {
    grid: auto-flow / auto auto;
    align-items: start;
    justify-items: start;
    place-items: start;
  }

.sensor-value {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}
.sensor-heading {
  font-weight: 300;
  padding-right: 8px;
  padding-bottom: 4px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.sensors:empty {
  display: none;
}
header {
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: calc(var(--st-default-spacing) * 6)
    calc(var(--st-default-spacing) * 4)
    calc(var(--st-default-spacing) * 4);

  padding: calc(var(--st-spacing, var(--st-default-spacing)) * 6)
    calc(var(--st-spacing, var(--st-default-spacing)) * 4)
    calc(var(--st-spacing, var(--st-default-spacing)) * 4);
}
.header__icon {
  margin-right: calc(var(--st-default-spacing) * 2);
  margin-right: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
  color: #44739e;
  color: var(--paper-item-icon-color, #44739e);
}
.header__title {
  font-size: 24px;
  font-size: var(--st-font-size-title, var(--ha-card-header-font-size, 24px));
  line-height: 24px;
  line-height: var(--st-font-size-title, var(--ha-card-header-font-size, 24px));
  -webkit-font-smoothing: var(--paper-font-headline_-_-webkit-font-smoothing);
  font-weight: normal;
  margin: 0;
  align-self: left;
}
.current-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  flex-wrap: wrap
}
.current-wrapper.row {
    flex-direction: row-reverse;
  }
.current--value {
  display: flex;
  align-items: center;
  margin: 0;
  font-weight: 500;
  letter-spacing: -1px;
  line-height: var(--paper-font-display1_-_font-size);
  line-height: var(--st-font-size-l, var(--paper-font-display1_-_font-size));
  font-size: var(--paper-font-display1_-_font-size);
  font-size: var(--st-font-size-l, var(--paper-font-display1_-_font-size))
}
@media (min-width: 768px) {
.current--value {
    font-size: var(--paper-font-display2_-_font-size);
    font-size: var(--st-font-size-xl, var(--paper-font-display2_-_font-size));
    line-height: var(--paper-font-display2_-_font-size);
    line-height: var(--st-font-size-xl, var(--paper-font-display2_-_font-size))
}
  }
.current--value.updating {
    color: var(--error-color);
  }
.current--unit {
  font-size: var(--paper-font-title_-_font-size);
  font-size: var(--st-font-size-m, var(--paper-font-title_-_font-size));
}
.thermostat-trigger {
  padding: 0px;
  border-radius: 50%;
  transition: background-color 0.2s ease, transform 0.1s ease;
}
.thermostat-trigger:hover {
  background-color: var(--secondary-background-color);
  transform: scale(1.1);
}
.thermostat-trigger:active {
  transform: scale(0.9);
}
.clickable {
  cursor: pointer;
}
.modes {
  display: grid;
  grid-template-columns: auto;
  grid-auto-flow: column;
  grid-gap: 2px;
  margin-top: calc(var(--st-default-spacing) * 2);
  margin-top: calc(var(--st-spacing, var(--st-default-spacing)) * 2);
  padding: var(--st-default-spacing);
  padding: var(--st-spacing, var(--st-default-spacing))
}
.modes.heading {
    grid-template-columns: -webkit-min-content;
    grid-template-columns: min-content;
  }
.mode-title {
  padding: 0 16px;
  align-self: center;
  justify-self: center;
  place-self: center;
  font-size: 16px;
  font-size: var(
    --st-font-size-sensors,
    var(--paper-font-subhead_-_font-size, 16px)
  );
  font-weight: 300;
  white-space: nowrap;
}
.mode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  min-height: 24px;
  padding: var(--st-default-spacing) 0;
  padding: var(--st-spacing, var(--st-default-spacing)) 0;
  background: var(--secondary-background-color);
  background: var(--st-mode-background, var(--secondary-background-color));
  color: var(--secondary-text-color);
  cursor: pointer;
  border-radius: 12px;
  transition: background-color 0.2s ease, transform 0.1s ease, color 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05)
}
.mode-item:hover {
    color: var(--primary-text-color);
    color: var(--st-mode-active-color, var(--primary-text-color));
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
.mode-item:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
.mode-item.active,
  .mode-item.active:hover {
    background: var(--primary-color);
    background: var(--st-mode-active-background, var(--primary-color));
    color: var(--text-primary-color);
    color: var(--st-mode-active-color, var(--text-primary-color));
    transform: translateY(0);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.15);
  }
.mode-item.active.off {
    background: var(--off-color);
    background: var(--st-mode-active-background, var(--off-color));
  }
.mode-item.active.heat {
    background: var(--heat-color);
    background: var(--st-mode-active-background, var(--heat-color));
  }
.mode-item.active.cool {
    background: var(--cool-color);
    background: var(--st-mode-active-background, var(--cool-color));
  }
.mode-item.active.heat_cool {
    background: var(--heat_cool-color);
    background: var(--st-mode-active-background, var(--heat_cool-color));
  }
.mode-item.active.auto {
    background: var(--auto-color);
    background: var(--st-mode-active-background, var(--auto-color));
  }
.mode-item.active.dry {
    background: var(--dry-color);
    background: var(--st-mode-active-background, var(--dry-color));
  }
.mode-item.active.fan_only {
    background: var(--fan_only-color);
    background: var(--st-mode-active-background, var(--fan_only-color));
  }
.mode-icon {
  --iron-icon-width: 24px;
  --iron-icon-height: 24px;
  display: block;
}
ha-switch {
  padding: 16px 6px;
}
.side-by-side {
  display: flex;
  align-items: center;
}
.side-by-side > * {
  flex: 1;
  padding-right: 4px;
}

/* 
 * ==============================================================
 * ULTRA MODERN THEME (Glassmorphism + Glowing Interactions)
 * ==============================================================
 */

ha-card.modern {
  background: rgba(20, 20, 20, 0.4);
  background: var(--st-modern-bg, rgba(20, 20, 20, 0.4));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  color: #ffffff;
  padding: 24px;
}

ha-card.modern .header__title,
ha-card.modern .header__icon {
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  font-weight: 600;
}

ha-card.modern .body {
  padding: 16px 0;
}

ha-card.modern .sensors {
  display: flex;
  justify-content: center;
  grid-gap: 12px;
  gap: 12px;
  margin-top: 16px;
  grid-template-columns: unset;
}

ha-card.modern .sensor-heading,
ha-card.modern .sensor-value {
  color: rgba(255, 255, 255, 0.7);
  display: block;
  font-size: 13px;
  padding: 0;
  margin: 0;
  justify-content: center;
}
ha-card.modern .sensor-value {
  color: #ffffff;
  font-weight: 500;
  margin-top: 4px;
}

ha-card.modern .sensor-item {
  /* Assuming we wrap infoItems in this if needed, else we target their layout */
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 16px;
  text-align: center;
}

/* Mode Buttons / Bottom Bar */
ha-card.modern .modes {
  display: flex;
  justify-content: space-around;
  grid-gap: 8px;
  gap: 8px;
  background: transparent;
  padding: 0;
}

ha-card.modern .mode-item {
  flex: 1;
  flex-direction: row;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.6);
  padding: 12px 0;
  font-weight: 500;
  box-shadow: none;
  min-height: auto;
  grid-gap: 8px;
  gap: 8px;
}

ha-card.modern .mode-item .mode-icon {
  --iron-icon-width: 20px;
  --iron-icon-height: 20px;
}

ha-card.modern .mode-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

ha-card.modern .mode-item.active {
  background: rgba(43, 154, 249, 0.2);
  border: 1px solid rgba(43, 154, 249, 0.5);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(43, 154, 249, 0.4),
    inset 0 0 10px rgba(43, 154, 249, 0.2);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}
ha-card.modern .mode-item.active.heat {
  background: rgba(255, 129, 0, 0.2);
  border: 1px solid rgba(255, 129, 0, 0.5);
  box-shadow: 0 0 20px rgba(255, 129, 0, 0.4),
    inset 0 0 10px rgba(255, 129, 0, 0.2);
}

/* 
 * Control Styles within Modern Theme
 */
ha-card.modern .current-wrapper {
  margin: 32px 0;
}

ha-card.modern .current--value {
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

ha-card.modern .thermostat-trigger {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin: 8px;
}

ha-card.modern .thermostat-trigger:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}

/* Style: Classic Numbers with Arrows Stacked */
ha-card.modern.style-classic .current-wrapper {
  flex-direction: column;
}

ha-card.modern.style-classic .current--value {
  font-size: 56px;
  line-height: 1;
  margin: 16px 0;
}

/* Style: Dial Arc Layout */
ha-card.modern.style-dial .current-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 8px solid rgba(255, 255, 255, 0.05);
  border-top-color: rgba(43, 154, 249, 0.8); /* Simulated glowing arc */
  border-right-color: rgba(43, 154, 249, 0.4);
  box-shadow: 0 0 30px rgba(43, 154, 249, 0.2),
    inset 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 24px auto;
}

ha-card.modern.style-dial .current--value {
  font-size: 48px;
  margin: 0;
  z-index: 2;
}

ha-card.modern.style-dial .thermostat-trigger {
  position: absolute;
  background: transparent;
  border: none;
  box-shadow: none;
  width: 100%;
  height: 50%;
  border-radius: 0;
  margin: 0;
}

ha-card.modern.style-dial .thermostat-trigger:hover {
  background: rgba(255, 255, 255, 0.05);
}

ha-card.modern.style-dial .thermostat-trigger[icon='hass:chevron-up'] {
  top: 0;
  align-items: flex-start;
  padding-top: 16px;
  border-top-left-radius: 100px;
  border-top-right-radius: 100px;
}

ha-card.modern.style-dial .thermostat-trigger[icon='hass:chevron-down'] {
  bottom: 0;
  align-items: flex-end;
  padding-bottom: 16px;
  border-bottom-left-radius: 100px;
  border-bottom-right-radius: 100px;
}

/* Editor Styles */
.card-config {
  display: flex;
  flex-direction: column;
}
.overall-config {
  margin-bottom: 20px;
}
.side-by-side {
  display: flex;
  flex-direction: row;
  align-items: center;
  grid-gap: 16px;
  gap: 16px;
  margin-bottom: 16px;
}
.side-by-side > * {
  flex: 1;
}

.overall-config > ha-formfield {
  display: block;
  margin-bottom: 8px;
}
`
function ie(e, t, i, n = {}) {
  ;(n = n || {}), (i = null == i ? {} : i)
  const s = new Event(t, {
    bubbles: void 0 === n.bubbles || n.bubbles,
    cancelable: Boolean(n.cancelable),
    composed: void 0 === n.composed || n.composed,
  })
  return (s.detail = i), e.dispatchEvent(s), s
}
function ne(e, t, i) {
  const n = t.split('.')
  let s = e
  for (; n.length - 1; ) {
    var o = n.shift()
    s.hasOwnProperty(o) || (s[o] = {}), (s = s[o])
  }
  s[n[0]] = i
}
!(function (e, t) {
  void 0 === t && (t = {})
  var i = t.insertAt
  if (e && 'undefined' != typeof document) {
    var n = document.head || document.getElementsByTagName('head')[0],
      s = document.createElement('style')
    ;(s.type = 'text/css'),
      'top' === i && n.firstChild
        ? n.insertBefore(s, n.firstChild)
        : n.appendChild(s),
      s.styleSheet
        ? (s.styleSheet.cssText = e)
        : s.appendChild(document.createTextNode(e))
  }
})(te)
const se = [0, 1],
  oe = [0.5, 1],
  re = ['column', 'row'],
  ae = ['standard', 'modern'],
  le = ['classic', 'dial'],
  ce = ['climate'],
  de = { header: {}, control: {}, layout: { mode: {} } },
  he = (e) => JSON.parse(JSON.stringify(e))
function ue(e, t) {
  var i = {}
  for (var n in e)
    Object.prototype.hasOwnProperty.call(e, n) &&
      t.indexOf(n) < 0 &&
      (i[n] = e[n])
  if (null != e && 'function' == typeof Object.getOwnPropertySymbols) {
    var s = 0
    for (n = Object.getOwnPropertySymbols(e); s < n.length; s++)
      t.indexOf(n[s]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(e, n[s]) &&
        (i[n[s]] = e[n[s]])
  }
  return i
}
function pe(e, t, i, n) {
  var s,
    o = arguments.length,
    r = o < 3 ? t : null === n ? (n = Object.getOwnPropertyDescriptor(t, i)) : n
  if ('object' == typeof Reflect && 'function' == typeof Reflect.decorate)
    r = Reflect.decorate(e, t, i, n)
  else
    for (var a = e.length - 1; a >= 0; a--)
      (s = e[a]) && (r = (o < 3 ? s(r) : o > 3 ? s(t, i, r) : s(t, i)) || r)
  return o > 3 && r && Object.defineProperty(t, i, r), r
}
const fe = (e, t, i, n) => {
    if ('length' === i || 'prototype' === i) return
    if ('arguments' === i || 'caller' === i) return
    const s = Object.getOwnPropertyDescriptor(e, i),
      o = Object.getOwnPropertyDescriptor(t, i)
    ;(!ge(s, o) && n) || Object.defineProperty(e, i, o)
  },
  ge = function (e, t) {
    return (
      void 0 === e ||
      e.configurable ||
      (e.writable === t.writable &&
        e.enumerable === t.enumerable &&
        e.configurable === t.configurable &&
        (e.writable || e.value === t.value))
    )
  },
  me = (e, t) => `/* Wrapped ${e}*/\n${t}`,
  ve = Object.getOwnPropertyDescriptor(Function.prototype, 'toString'),
  ye = Object.getOwnPropertyDescriptor(Function.prototype.toString, 'name')
var be = (e, t, { ignoreNonConfigurable: i = !1 } = {}) => {
  const { name: n } = e
  for (const n of Reflect.ownKeys(t)) fe(e, t, n, i)
  return (
    ((e, t) => {
      const i = Object.getPrototypeOf(t)
      i !== Object.getPrototypeOf(e) && Object.setPrototypeOf(e, i)
    })(e, t),
    ((e, t, i) => {
      const n = '' === i ? '' : `with ${i.trim()}() `,
        s = me.bind(null, n, t.toString())
      Object.defineProperty(s, 'name', ye),
        Object.defineProperty(e, 'toString', { ...ve, value: s })
    })(e, t, n),
    e
  )
}
const _e = (e, t = {}) => {
  if ('function' != typeof e)
    throw new TypeError(
      `Expected the first argument to be a function, got \`${typeof e}\``
    )
  const {
    wait: i = 0,
    maxWait: n = Number.Infinity,
    before: s = !1,
    after: o = !0,
  } = t
  if (!s && !o)
    throw new Error(
      "Both `before` and `after` are false, function wouldn't be called."
    )
  let r, a, l
  const c = function (...t) {
    const c = this,
      d = () => {
        ;(a = void 0),
          r && (clearTimeout(r), (r = void 0)),
          o && (l = e.apply(c, t))
      },
      h = s && !r
    return (
      clearTimeout(r),
      (r = setTimeout(() => {
        ;(r = void 0),
          a && (clearTimeout(a), (a = void 0)),
          o && (l = e.apply(c, t))
      }, i)),
      n > 0 && n !== Number.Infinity && !a && (a = setTimeout(d, n)),
      h && (l = e.apply(c, t)),
      l
    )
  }
  return (
    be(c, e),
    (c.cancel = () => {
      r && (clearTimeout(r), (r = void 0)), a && (clearTimeout(a), (a = void 0))
    }),
    c
  )
}
function we(e, { decimals: t = 1, fallback: i = 'N/A' } = {}) {
  return null === e || '' === e || ['boolean', 'undefined'].includes(typeof e)
    ? i
    : Number(e).toFixed(t)
}
function xe({
  header: e,
  toggleEntityChanged: t,
  entity: i,
  openEntityPopover: n,
}) {
  var s, o
  if (!1 === e) return v
  const r = i.attributes.hvac_action || i.state
  let a = e.icon
  'object' == typeof e.icon &&
    (a = null !== (s = null == a ? void 0 : a[r]) && void 0 !== s && s)
  const l = null !== (o = null == e ? void 0 : e.name) && void 0 !== o && o
  return I`<header><div style="display:flex" class="clickable" @click="${() =>
    n()}">${(function (e) {
    return e ? I`<ha-icon class="header__icon" .icon="${e}"></ha-icon>` : v
  })(a)} ${(function (e) {
    return e ? I`<h2 class="header__title">${e}</h2>` : v
  })(l)}</div>${(function (e, t) {
    if (0 === e.length) return v
    const i = e.map(
      ({ icon: e, hide_inactive: i, state: n }) =>
        I`<ha-icon class="fault-icon ${
          'on' === n.state ? 'active' : i ? ' hide' : ''
        }" icon="${e || n.attributes.icon}" @click="${() =>
          t(n.entity_id)}"></ha-icon>`
    )
    return I`<div class="faults">${i}</div>`
  })(e.faults, n)} ${(function (e, t, i) {
    var n
    return e
      ? I`<div style="margin-left:auto"><span class="clickable toggle-label" @click="${() =>
          t(e.entity.entity_id)}">${e.label}</span><ha-switch .checked="${
          'on' === (null === (n = e.entity) || void 0 === n ? void 0 : n.state)
        }" @change="${i}"></ha-switch></div>`
      : v
  })(e.toggle, n, t)}</header>`
}
'undefined' != typeof globalThis
  ? globalThis
  : 'undefined' != typeof window
  ? window
  : 'undefined' != typeof global
  ? global
  : 'undefined' != typeof self && self
var Se,
  $e =
    ((function (e, t) {
      !(function (e) {
        function t(e) {
          var i,
            n,
            s = new Error(e)
          return (
            (i = s),
            (n = t.prototype),
            Object.setPrototypeOf
              ? Object.setPrototypeOf(i, n)
              : (i.__proto__ = n),
            s
          )
        }
        function i(e, i, n) {
          var s = i.slice(0, n).split(/\n/),
            o = s.length,
            r = s[o - 1].length + 1
          throw t(
            (e +=
              ' at line ' +
              o +
              ' col ' +
              r +
              ':\n\n  ' +
              i.split(/\n/)[o - 1] +
              '\n  ' +
              Array(r).join(' ') +
              '^')
          )
        }
        t.prototype = Object.create(Error.prototype, {
          name: { value: 'Squirrelly Error', enumerable: !1 },
        })
        var n = new Function('return this')().Promise,
          s = !1
        try {
          s = new Function('return (async function(){}).constructor')()
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e
        }
        function o(e, t) {
          return Object.prototype.hasOwnProperty.call(e, t)
        }
        function r(e, t, i) {
          for (var n in t)
            o(t, n) &&
              (null == t[n] ||
              'object' != typeof t[n] ||
              ('storage' !== n && 'prefixes' !== n) ||
              i
                ? (e[n] = t[n])
                : (e[n] = r({}, t[n])))
          return e
        }
        var a = /^async +/,
          l = /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})*}|(?!\${)[^\\`])*`/g,
          c = /'(?:\\[\s\w"'\\`]|[^\n\r'\\])*?'/g,
          d = /"(?:\\[\s\w"'\\`]|[^\n\r"\\])*?"/g,
          h = /[.*+\-?^${}()|[\]\\]/g
        function u(e) {
          return h.test(e) ? e.replace(h, '\\$&') : e
        }
        function p(e, n) {
          n.rmWhitespace &&
            (e = e.replace(/[\r\n]+/g, '\n').replace(/^\s+|\s+$/gm, '')),
            (l.lastIndex = 0),
            (c.lastIndex = 0),
            (d.lastIndex = 0)
          var s = n.prefixes,
            o = [s.h, s.b, s.i, s.r, s.c, s.e].reduce(function (e, t) {
              return e && t ? e + '|' + u(t) : t ? u(t) : e
            }, ''),
            r = new RegExp(
              '([|()]|=>)|(\'|"|`|\\/\\*)|\\s*((\\/)?(-|_)?' +
                u(n.tags[1]) +
                ')',
              'g'
            ),
            h = new RegExp(
              '([^]*?)' + u(n.tags[0]) + '(-|_)?\\s*(' + o + ')?\\s*',
              'g'
            ),
            p = 0,
            f = !1
          function g(t, s) {
            var o,
              u = { f: [] },
              g = 0,
              m = 'c'
            function v(t) {
              var s = e.slice(p, t),
                o = s.trim()
              if ('f' === m)
                'safe' === o
                  ? (u.raw = !0)
                  : n.async && a.test(o)
                  ? ((o = o.replace(a, '')), u.f.push([o, '', !0]))
                  : u.f.push([o, ''])
              else if ('fp' === m) u.f[u.f.length - 1][1] += o
              else if ('err' === m) {
                if (o) {
                  var r = s.search(/\S/)
                  i('invalid syntax', e, p + r)
                }
              } else u[m] = o
              p = t + 1
            }
            for (
              'h' === s || 'b' === s || 'c' === s
                ? (m = 'n')
                : 'r' === s && ((u.raw = !0), (s = 'i')),
                r.lastIndex = p;
              null !== (o = r.exec(e));

            ) {
              var y = o[1],
                b = o[2],
                _ = o[3],
                w = o[4],
                x = o[5],
                S = o.index
              if (y)
                '(' === y
                  ? (0 === g &&
                      ('n' === m
                        ? (v(S), (m = 'p'))
                        : 'f' === m && (v(S), (m = 'fp'))),
                    g++)
                  : ')' === y
                  ? 0 == --g && 'c' !== m && (v(S), (m = 'err'))
                  : 0 === g && '|' === y
                  ? (v(S), (m = 'f'))
                  : '=>' === y && (v(S), (p += 1), (m = 'res'))
              else if (b)
                if ('/*' === b) {
                  var $ = e.indexOf('*/', r.lastIndex)
                  ;-1 === $ && i('unclosed comment', e, o.index),
                    (r.lastIndex = $ + 2)
                } else
                  "'" === b
                    ? ((c.lastIndex = o.index),
                      c.exec(e)
                        ? (r.lastIndex = c.lastIndex)
                        : i('unclosed string', e, o.index))
                    : '"' === b
                    ? ((d.lastIndex = o.index),
                      d.exec(e)
                        ? (r.lastIndex = d.lastIndex)
                        : i('unclosed string', e, o.index))
                    : '`' === b &&
                      ((l.lastIndex = o.index),
                      l.exec(e)
                        ? (r.lastIndex = l.lastIndex)
                        : i('unclosed string', e, o.index))
              else if (_)
                return (
                  v(S),
                  (p = S + o[0].length),
                  (h.lastIndex = p),
                  (f = x),
                  w && 'h' === s && (s = 's'),
                  (u.t = s),
                  u
                )
            }
            return i('unclosed tag', e, t), u
          }
          var m = (function o(r, l) {
            ;(r.b = []), (r.d = [])
            var c,
              d = !1,
              u = []
            function m(e, t) {
              e &&
                (e = (function (e, t, i, n) {
                  var s, o
                  return (
                    'string' == typeof t.autoTrim
                      ? (s = o = t.autoTrim)
                      : Array.isArray(t.autoTrim) &&
                        ((s = t.autoTrim[1]), (o = t.autoTrim[0])),
                    (i || !1 === i) && (s = i),
                    (n || !1 === n) && (o = n),
                    'slurp' === s && 'slurp' === o
                      ? e.trim()
                      : ('_' === s || 'slurp' === s
                          ? (e = String.prototype.trimLeft
                              ? e.trimLeft()
                              : e.replace(/^[\s\uFEFF\xA0]+/, ''))
                          : ('-' !== s && 'nl' !== s) ||
                            (e = e.replace(/^(?:\n|\r|\r\n)/, '')),
                        '_' === o || 'slurp' === o
                          ? (e = String.prototype.trimRight
                              ? e.trimRight()
                              : e.replace(/[\s\uFEFF\xA0]+$/, ''))
                          : ('-' !== o && 'nl' !== o) ||
                            (e = e.replace(/(?:\n|\r|\r\n)$/, '')),
                        e)
                  )
                })(e, n, f, t)) &&
                ((e = e.replace(/\\|'/g, '\\$&').replace(/\r\n|\n|\r/g, '\\n')),
                u.push(e))
            }
            for (; null !== (c = h.exec(e)); ) {
              var v,
                y = c[1],
                b = c[2],
                _ = c[3] || ''
              for (var w in s)
                if (s[w] === _) {
                  v = w
                  break
                }
              m(y, b),
                (p = c.index + c[0].length),
                v || i('unrecognized tag type: ' + _, e, p)
              var x = g(c.index, v),
                S = x.t
              if ('h' === S) {
                var $ = x.n || ''
                n.async && a.test($) && ((x.a = !0), (x.n = $.replace(a, ''))),
                  (x = o(x)),
                  u.push(x)
              } else if ('c' === S) {
                if (r.n === x.n)
                  return d ? ((d.d = u), r.b.push(d)) : (r.d = u), r
                i("Helper start and end don't match", e, c.index + c[0].length)
              } else if ('b' === S) {
                d ? ((d.d = u), r.b.push(d)) : (r.d = u)
                var k = x.n || ''
                n.async && a.test(k) && ((x.a = !0), (x.n = k.replace(a, ''))),
                  (d = x),
                  (u = [])
              } else if ('s' === S) {
                var P = x.n || ''
                n.async && a.test(P) && ((x.a = !0), (x.n = P.replace(a, ''))),
                  u.push(x)
              } else u.push(x)
            }
            if (!l) throw t('unclosed helper "' + r.n + '"')
            return m(e.slice(p, e.length), !1), (r.d = u), r
          })({ f: [] }, !0)
          if (n.plugins)
            for (var v = 0; v < n.plugins.length; v++) {
              var y = n.plugins[v]
              y.processAST && (m.d = y.processAST(m.d, n))
            }
          return m.d
        }
        function f(e, t) {
          var i = p(e, t),
            n =
              "var tR='';" +
              (t.useWith ? 'with(' + t.varName + '||{}){' : '') +
              b(i, t) +
              'if(cb){cb(null,tR)} return tR' +
              (t.useWith ? '}' : '')
          if (t.plugins)
            for (var s = 0; s < t.plugins.length; s++) {
              var o = t.plugins[s]
              o.processFnString && (n = o.processFnString(n, t))
            }
          return n
        }
        function g(e, t) {
          for (var i = 0; i < t.length; i++) {
            var n = t[i][0],
              s = t[i][1]
            ;(e = (t[i][2] ? 'await ' : '') + "c.l('F','" + n + "')(" + e),
              s && (e += ',' + s),
              (e += ')')
          }
          return e
        }
        function m(e, t, i, n, s, o) {
          var r =
            '{exec:' + (s ? 'async ' : '') + y(i, t, e) + ',params:[' + n + ']'
          return (
            o && (r += ",name:'" + o + "'"), s && (r += ',async:true'), r + '}'
          )
        }
        function v(e, t) {
          for (var i = '[', n = 0; n < e.length; n++) {
            var s = e[n]
            ;(i += m(t, s.res || '', s.d, s.p || '', s.a, s.n)),
              n < e.length && (i += ',')
          }
          return i + ']'
        }
        function y(e, t, i) {
          return 'function(' + t + "){var tR='';" + b(e, i) + 'return tR}'
        }
        function b(e, t) {
          for (var i = 0, n = e.length, s = ''; i < n; i++) {
            var o = e[i]
            if ('string' == typeof o) s += "tR+='" + o + "';"
            else {
              var r = o.t,
                a = o.c || '',
                l = o.f,
                c = o.n || '',
                d = o.p || '',
                h = o.res || '',
                u = o.b,
                p = !!o.a
              if ('i' === r) {
                t.defaultFilter &&
                  (a = "c.l('F','" + t.defaultFilter + "')(" + a + ')')
                var f = g(a, l)
                !o.raw && t.autoEscape && (f = "c.l('F','e')(" + f + ')'),
                  (s += 'tR+=' + f + ';')
              } else if ('h' === r)
                if (t.storage.nativeHelpers.get(c))
                  s += t.storage.nativeHelpers.get(c)(o, t)
                else {
                  var y =
                    (p ? 'await ' : '') +
                    "c.l('H','" +
                    c +
                    "')(" +
                    m(t, h, o.d, d, p)
                  ;(y += u ? ',' + v(u, t) : ',[]'),
                    (s += 'tR+=' + g((y += ',c)'), l) + ';')
                }
              else
                's' === r
                  ? (s +=
                      'tR+=' +
                      g(
                        (p ? 'await ' : '') +
                          "c.l('H','" +
                          c +
                          "')({params:[" +
                          d +
                          ']},[],c)',
                        l
                      ) +
                      ';')
                  : 'e' === r && (s += a + '\n')
            }
          }
          return s
        }
        var _ = (function () {
          function e(e) {
            this.cache = e
          }
          return (
            (e.prototype.define = function (e, t) {
              this.cache[e] = t
            }),
            (e.prototype.get = function (e) {
              return this.cache[e]
            }),
            (e.prototype.remove = function (e) {
              delete this.cache[e]
            }),
            (e.prototype.reset = function () {
              this.cache = {}
            }),
            (e.prototype.load = function (e) {
              r(this.cache, e, !0)
            }),
            e
          )
        })()
        function w(e, i, n, s) {
          if (i && i.length > 0)
            throw t(
              (s ? 'Native' : '') + "Helper '" + e + "' doesn't accept blocks"
            )
          if (n && n.length > 0)
            throw t(
              (s ? 'Native' : '') + "Helper '" + e + "' doesn't accept filters"
            )
        }
        var x = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }
        function S(e) {
          return x[e]
        }
        var $ = new _({}),
          k = new _({
            each: function (e, t) {
              var i = '',
                n = e.params[0]
              if ((w('each', t, !1), e.async))
                return new Promise(function (t) {
                  !(function e(t, i, n, s, o) {
                    n(t[i], i).then(function (r) {
                      ;(s += r),
                        i === t.length - 1 ? o(s) : e(t, i + 1, n, s, o)
                    })
                  })(n, 0, e.exec, i, t)
                })
              for (var s = 0; s < n.length; s++) i += e.exec(n[s], s)
              return i
            },
            foreach: function (e, t) {
              var i = e.params[0]
              if ((w('foreach', t, !1), e.async))
                return new Promise(function (t) {
                  !(function e(t, i, n, s, o, r) {
                    s(i[n], t[i[n]]).then(function (a) {
                      ;(o += a),
                        n === i.length - 1 ? r(o) : e(t, i, n + 1, s, o, r)
                    })
                  })(i, Object.keys(i), 0, e.exec, '', t)
                })
              var n = ''
              for (var s in i) o(i, s) && (n += e.exec(s, i[s]))
              return n
            },
            include: function (e, i, n) {
              w('include', i, !1)
              var s = n.storage.templates.get(e.params[0])
              if (!s) throw t('Could not fetch template "' + e.params[0] + '"')
              return s(e.params[1], n)
            },
            extends: function (e, i, n) {
              var s = e.params[1] || {}
              s.content = e.exec()
              for (var o = 0; o < i.length; o++) {
                var r = i[o]
                s[r.name] = r.exec()
              }
              var a = n.storage.templates.get(e.params[0])
              if (!a) throw t('Could not fetch template "' + e.params[0] + '"')
              return a(s, n)
            },
            useScope: function (e, t) {
              return w('useScope', t, !1), e.exec(e.params[0])
            },
          }),
          P = new _({
            if: function (e, t) {
              w('if', !1, e.f, !0)
              var i = 'if(' + e.p + '){' + b(e.d, t) + '}'
              if (e.b)
                for (var n = 0; n < e.b.length; n++) {
                  var s = e.b[n]
                  'else' === s.n
                    ? (i += 'else{' + b(s.d, t) + '}')
                    : 'elif' === s.n &&
                      (i += 'else if(' + s.p + '){' + b(s.d, t) + '}')
                }
              return i
            },
            try: function (e, i) {
              if (
                (w('try', !1, e.f, !0),
                !e.b || 1 !== e.b.length || 'catch' !== e.b[0].n)
              )
                throw t("native helper 'try' only accepts 1 block, 'catch'")
              var n = 'try{' + b(e.d, i) + '}',
                s = e.b[0]
              return (
                n +
                'catch' +
                (s.res ? '(' + s.res + ')' : '') +
                '{' +
                b(s.d, i) +
                '}'
              )
            },
            block: function (e, t) {
              return (
                w('block', e.b, e.f, !0),
                'if(!' +
                  t.varName +
                  '[' +
                  e.p +
                  ']){tR+=(' +
                  y(e.d, '', t) +
                  ')()}else{tR+=' +
                  t.varName +
                  '[' +
                  e.p +
                  ']}'
              )
            },
          }),
          O = new _({
            e: function (e) {
              var t = String(e)
              return /[&<>"']/.test(t) ? t.replace(/[&<>"']/g, S) : t
            },
          }),
          C = {
            varName: 'it',
            autoTrim: [!1, 'nl'],
            autoEscape: !0,
            defaultFilter: !1,
            tags: ['{{', '}}'],
            l: function (e, i) {
              if ('H' === e) {
                var n = this.storage.helpers.get(i)
                if (n) return n
                throw t("Can't find helper '" + i + "'")
              }
              if ('F' === e) {
                var s = this.storage.filters.get(i)
                if (s) return s
                throw t("Can't find filter '" + i + "'")
              }
            },
            async: !1,
            storage: { helpers: k, nativeHelpers: P, filters: O, templates: $ },
            prefixes: { h: '@', b: '#', i: '', r: '*', c: '/', e: '!' },
            cache: !1,
            plugins: [],
            useWith: !1,
          }
        function E(e, t) {
          var i = {}
          return r(i, C), t && r(i, t), e && r(i, e), i.l.bind(i), i
        }
        function j(e, i) {
          var n = E(i || {}),
            o = Function
          if (n.async) {
            if (!s) throw t("This environment doesn't support async/await")
            o = s
          }
          try {
            return new o(n.varName, 'c', 'cb', f(e, n))
          } catch (i) {
            throw i instanceof SyntaxError
              ? t(
                  'Bad template syntax\n\n' +
                    i.message +
                    '\n' +
                    Array(i.message.length + 1).join('=') +
                    '\n' +
                    f(e, n)
                )
              : i
          }
        }
        function N(e, t) {
          var i
          return t.cache && t.name && t.storage.templates.get(t.name)
            ? t.storage.templates.get(t.name)
            : ((i = 'function' == typeof e ? e : j(e, t)),
              t.cache && t.name && t.storage.templates.define(t.name, i),
              i)
        }
        C.l.bind(C),
          (e.compile = j),
          (e.compileScope = b),
          (e.compileScopeIntoFunction = y),
          (e.compileToString = f),
          (e.defaultConfig = C),
          (e.filters = O),
          (e.getConfig = E),
          (e.helpers = k),
          (e.nativeHelpers = P),
          (e.parse = p),
          (e.render = function (e, i, s, o) {
            var r = E(s || {})
            if (!r.async) return N(e, r)(i, r)
            if (!o) {
              if ('function' == typeof n)
                return new n(function (t, n) {
                  try {
                    t(N(e, r)(i, r))
                  } catch (e) {
                    n(e)
                  }
                })
              throw t(
                "Please provide a callback function, this env doesn't support Promises"
              )
            }
            try {
              N(e, r)(i, r, o)
            } catch (e) {
              return o(e)
            }
          }),
          (e.templates = $),
          Object.defineProperty(e, '__esModule', { value: !0 })
      })(t)
    })((Se = { exports: {} }), Se.exports),
    Se.exports)
const ke = new WeakMap(),
  Pe =
    ((Oe = (e) => (t) => {
      if (!(t instanceof P))
        throw new Error('unsafeHTML can only be used in text bindings')
      const i = ke.get(t)
      if (void 0 !== i && x(e) && e === i.value && t.value === i.fragment)
        return
      const n = document.createElement('template')
      n.innerHTML = e
      const s = document.importNode(n.content, !0)
      t.setValue(s), ke.set(t, { value: e, fragment: s })
    }),
    (...e) => {
      const t = Oe(...e)
      return f.set(t, !0), t
    })
var Oe
const Ce = (e) => `<ha-icon icon="${e}"></ha-icon>`
function Ee(e, t) {
  var i, n
  const { type: s, labels: o } =
    null !==
      (n =
        null === (i = null == e ? void 0 : e.layout) || void 0 === i
          ? void 0
          : i.sensors) && void 0 !== n
      ? n
      : { type: 'table', labels: !0 }
  return I`<div class="sensors ${[
    o ? 'with-labels' : 'without-labels',
    'list' === s ? 'as-list' : 'as-table',
  ].join(' ')}">${t}</div>`
}
function je({
  hide: e = !1,
  hass: t,
  state: i,
  details: n,
  localize: s,
  openEntityPopover: o,
}) {
  var r, a
  if (e || void 0 === i) return
  const { type: l, heading: c, icon: d, unit: h, decimals: u } = n
  let p
  if (
    (process.env.DEBUG && console.log('ST: infoItem', { state: i, details: n }),
    'relativetime' === l)
  )
    p = I`<div class="sensor-value"><ha-relative-time .datetime="${i}" .hass="${t}"></ha-relative-time></div>`
  else if ('object' == typeof i) {
    const [e] = i.entity_id.split('.'),
      t = [
        'component',
        e,
        'state',
        null !==
          (a =
            null === (r = i.attributes) || void 0 === r
              ? void 0
              : r.device_class) && void 0 !== a
          ? a
          : '_',
        '',
      ].join('.')
    let n = s(i.state, t)
    'number' == typeof u && (n = we(n, { decimals: u })),
      (p = I`<div class="sensor-value clickable" @click="${() =>
        o(i.entity_id)}">${n} ${h || i.attributes.unit_of_measurement}</div>`)
  } else {
    let e = 'number' == typeof u ? we(i, { decimals: u }) : i
    p = I`<div class="sensor-value">${e}${h}</div>`
  }
  if (!1 === c) return p
  const f = d ? I`<ha-icon icon="${d}"></ha-icon>` : I`${c}:`
  return I`<div class="sensor-heading">${f}</div>${p}`
}
var Ne
function Te({ state: e, mode: t, modeOptions: i, localize: n, setMode: s }) {
  var o
  const { type: r, hide_when_off: a, mode: l = 'none', list: c, name: d } = t
  if (0 === c.length || (a && e === Ne.OFF)) return null
  let h = `state_attributes.climate.${r}_mode.`
  'hvac' === r && (h = 'component.climate.state._.')
  const u =
      d || n(`ui.card.climate.${'hvac' == r ? 'operation' : `${r}_mode`}`),
    p = null === (o = null == i ? void 0 : i.headings) || void 0 === o || o
  return I`<div class="modes ${p ? 'heading' : ''}">${
    p ? I`<div class="mode-title">${u}</div>` : ''
  } ${c.map(
    ({ value: e, icon: t, name: o }) =>
      I`<div class="mode-item ${e === l ? 'active ' + l : ''}" @click="${() =>
        s(r, e)}">${((e) =>
        e
          ? !1 === (null == i ? void 0 : i.icons)
            ? null
            : I`<ha-icon class="mode-icon" .icon="${e}"></ha-icon>`
          : null)(t)} ${((e) =>
        !1 === e || !1 === (null == i ? void 0 : i.names) ? null : n(e, h))(
        o
      )}</div>`
  )}</div>`
}
;($e.defaultConfig.autoEscape = !1),
  $e.filters.define('icon', Ce),
  $e.filters.define('join', (e, t = ', ') => e.join(t)),
  $e.filters.define(
    'css',
    (e, t) =>
      `<span style="${Object.entries(t).reduce(
        (e, [t, i]) => `${e}${t}:${i};`,
        ''
      )}">${e}</span>`
  ),
  $e.filters.define('debug', (e) => {
    try {
      return JSON.stringify(e)
    } catch (t) {
      return `Not able to read valid JSON object from: ${e}`
    }
  }),
  (function (e) {
    ;(e.OFF = 'off'),
      (e.HEAT = 'heat'),
      (e.COOL = 'cool'),
      (e.HEAT_COOL = 'heat_cool'),
      (e.AUTO = 'auto'),
      (e.DRY = 'dry'),
      (e.FAN_ONLY = 'fan_only')
  })(Ne || (Ne = {}))
const Ae = {
    auto: 'mdi:radiator',
    cooling: 'mdi:snowflake',
    fan: 'mdi:fan',
    heating: 'mdi:radiator',
    idle: 'mdi:radiator-disabled',
    off: 'mdi:radiator-off',
  },
  ze = {
    auto: 'hass:autorenew',
    cool: 'hass:snowflake',
    dry: 'hass:water-percent',
    fan_only: 'hass:fan',
    heat_cool: 'hass:autorenew',
    heat: 'hass:fire',
    off: 'hass:power',
  }
function Ve(e, t) {
  var i
  const n = t.states[e.entity]
  let s = ''
  return (
    (s =
      !0 === (null == e ? void 0 : e.name)
        ? n.attributes.name
        : null !== (i = null == e ? void 0 : e.name) && void 0 !== i
        ? i
        : ''),
    { entity: n, label: s }
  )
}
function Re(e, t) {
  return Array.isArray(e)
    ? e.map((e) => {
        var { entity: i } = e,
          n = ue(e, ['entity'])
        return Object.assign(Object.assign({}, n), {
          state: t.states[i],
          entity: i,
        })
      })
    : []
}
var Ie
!(function (e) {
  ;(e.HVAC = 'hvac'),
    (e.FAN = 'fan'),
    (e.PRESET = 'preset'),
    (e.SWING = 'swing')
})(Ie || (Ie = {}))
const Me = Object.values(Ie),
  Ue = [Ie.HVAC, Ie.PRESET],
  Fe = 'hass:chevron-up',
  He = 'hass:chevron-down',
  Le = 'mdi:plus',
  qe = 'mdi:minus',
  Be = { temperature: !1, state: !1 }
function De(e, t, i = {}) {
  return t[`${e}_modes`]
    .filter((e) =>
      (function (e, t) {
        var i
        if ('object' == typeof t[e]) return !1 !== t[e].include
        return null === (i = null == t ? void 0 : t[e]) || void 0 === i || i
      })(e, i)
    )
    .map((e) => {
      const t = 'object' == typeof i[e] ? i[e] : {}
      return Object.assign({ icon: ze[e], value: e, name: e }, t)
    })
}
class We extends ee {
  constructor() {
    super(...arguments),
      (this.modes = []),
      (this._hass = {}),
      (this.sensors = []),
      (this.showSensors = !0),
      (this.name = ''),
      (this.stepSize = 0.5),
      (this._values = {}),
      (this._updatingValues = !1),
      (this._hide = Be),
      (this._debouncedSetTemperature = _e(
        (e) => {
          const { domain: t, service: i, data: n = {} } = this.service
          this._hass.callService(
            t,
            i,
            Object.assign(
              Object.assign({ entity_id: this.config.entity }, n),
              e
            )
          )
        },
        { wait: 500 }
      )),
      (this.localize = (e, t = '') => {
        var i
        const n = this._hass.selectedLanguage || this._hass.language,
          s = `${t}${e}`,
          o = this._hass.resources[n]
        return null !== (i = null == o ? void 0 : o[s]) && void 0 !== i ? i : e
      }),
      (this.toggleEntityChanged = (e) => {
        var t, i, n, s
        if (
          !this.header ||
          !(null === (t = null == this ? void 0 : this.header) || void 0 === t
            ? void 0
            : t.toggle)
        )
          return
        const o = e.target
        this._hass.callService(
          'homeassistant',
          o.checked ? 'turn_on' : 'turn_off',
          {
            entity_id:
              null ===
                (s =
                  null ===
                    (n =
                      null === (i = this.header) || void 0 === i
                        ? void 0
                        : i.toggle) || void 0 === n
                    ? void 0
                    : n.entity) || void 0 === s
                ? void 0
                : s.entity_id,
          }
        )
      }),
      (this.setMode = (e, t) => {
        e && t
          ? (this._hass.callService('climate', `set_${e}_mode`, {
              entity_id: this.config.entity,
              [`${e}_mode`]: t,
            }),
            ie(this, 'haptic', 'light'))
          : ie(this, 'haptic', 'failure')
      }),
      (this.openEntityPopover = (e = null) => {
        ie(this, 'hass-more-info', { entityId: e || this.config.entity })
      })
  }
  static get styles() {
    return te
  }
  static getConfigElement() {
    return window.document.createElement(`${e}-editor`)
  }
  setConfig(e) {
    this.config = Object.assign({ decimals: 1 }, e)
  }
  updated() {
    super.connectedCallback()
    const e = Array.from(this.renderRoot.querySelectorAll('[with-hass]'))
    for (const t of Array.from(e))
      Array.from(t.attributes).forEach((e) => {
        e.name.startsWith('fwd-') && (t[e.name.replace('fwd-', '')] = e.value)
      }),
        (t.hass = this._hass)
  }
  set hass(e) {
    var t, i, n, s
    if (!this.config.entity) return
    const o = e.states[this.config.entity]
    if (void 0 === typeof o) return
    ;(this._hass = e),
      this.entity !== o && (this.entity = o),
      (this.header = (function (e, t, i) {
        if (!1 === e) return !1
        let n
        n =
          'string' == typeof (null == e ? void 0 : e.name)
            ? e.name
            : !1 !== (null == e ? void 0 : e.name) && t.attributes.friendly_name
        let s = t.attributes.hvac_action ? Ae : ze
        return (
          void 0 !== (null == e ? void 0 : e.icon) && (s = e.icon),
          {
            name: n,
            icon: s,
            toggle: (null == e ? void 0 : e.toggle) ? Ve(e.toggle, i) : null,
            faults: Re(null == e ? void 0 : e.faults, i),
          }
        )
      })(this.config.header, o, e)),
      (this.service = (null !==
        (i = null === (t = this.config) || void 0 === t ? void 0 : t.service) &&
        void 0 !== i &&
        i) || { domain: 'climate', service: 'set_temperature' })
    const r = o.attributes
    let a = (function (e, t) {
      if (!1 === e) return {}
      if (e)
        return Object.keys(e).reduce((i, n) => {
          const s = e[n]
          return (null == s ? void 0 : s.hide)
            ? i
            : Object.assign(Object.assign({}, i), {
                [n]: null == t ? void 0 : t[n],
              })
        }, {})
      return 'dual' ===
        (function (e) {
          return 'number' == typeof e.target_temp_high &&
            'number' == typeof e.target_temp_low
            ? 'dual'
            : 'single'
        })(t)
        ? {
            target_temp_low: t.target_temp_low,
            target_temp_high: t.target_temp_high,
          }
        : { temperature: t.temperature }
    })(
      null !==
        (s =
          null === (n = this.config) || void 0 === n ? void 0 : n.setpoints) &&
        void 0 !== s
        ? s
        : null,
      r
    )
    this._updatingValues &&
    (function (e, t) {
      const i = Object.keys(e)
      return (
        i.length === Object.keys(t).length &&
        !i.some(
          (i) => (null == e ? void 0 : e[i]) !== (null == t ? void 0 : t[i])
        )
      )
    })(a, this._values)
      ? (this._updatingValues = !1)
      : this._updatingValues || (this._values = a)
    const l = (e) => Me.includes(e) && r[`${e}_modes`],
      c = (e) =>
        e.filter(l).map((e) => ({ type: e, hide_when_off: !1, list: De(e, r) }))
    let d = []
    if (!1 === this.config.control) d = []
    else if (Array.isArray(this.config.control)) d = c(this.config.control)
    else if ('object' == typeof this.config.control) {
      const e = Object.entries(this.config.control)
      d =
        e.length > 0
          ? e
              .filter(([e]) => l(e))
              .map(([e, t]) => {
                const { _name: i, _hide_when_off: n } = t,
                  s = ue(t, ['_name', '_hide_when_off'])
                return { type: e, hide_when_off: n, name: i, list: De(e, r, s) }
              })
          : c(Ue)
    } else d = c(Ue)
    if (
      ((this.modes = d.map((e) => {
        if (e.type === Ie.HVAC) {
          const t = [],
            i = Object.values(Ne)
          return (
            e.list.forEach((e) => {
              const n = i.indexOf(e.value)
              t[n] = e
            }),
            Object.assign(Object.assign({}, e), { list: t, mode: o.state })
          )
        }
        const t = r[`${e.type}_mode`]
        return Object.assign(Object.assign({}, e), { mode: t })
      })),
      this.config.step_size && (this.stepSize = +this.config.step_size),
      this.config.hide &&
        (this._hide = Object.assign(
          Object.assign({}, this._hide),
          this.config.hide
        )),
      !1 === this.config.sensors)
    )
      this.showSensors = !1
    else if (3 === this.config.version) {
      this.sensors = []
      const e = this.config.sensors.map((e, t) => {
          var i, n
          const s =
            null !== (i = null == e ? void 0 : e.entity) && void 0 !== i
              ? i
              : this.config.entity
          let o = this.entity
          return (
            (null == e ? void 0 : e.entity) &&
              (o = this._hass.states[e.entity]),
            {
              id:
                null !== (n = null == e ? void 0 : e.id) && void 0 !== n
                  ? n
                  : String(t),
              label: null == e ? void 0 : e.label,
              template: e.template,
              show: !1 !== (null == e ? void 0 : e.show),
              entityId: s,
              context: o,
            }
          )
        }),
        t = e.map((e) => e.id),
        i = []
      t.includes('state') ||
        i.push({
          id: 'state',
          label: '{{ui.operation}}',
          template: '{{state.text}}',
          entityId: this.config.entity,
          context: this.entity,
        }),
        t.includes('temperature') ||
          i.push({
            id: 'temperature',
            label: '{{ui.currently}}',
            template: '{{current_temperature|formatNumber}}',
            entityId: this.config.entity,
            context: this.entity,
          }),
        (this.sensors = [...i, ...e])
    } else
      this.config.sensors &&
        (this.sensors = this.config.sensors.map((t) => {
          var i,
            { name: n, entity: s, attribute: o, unit: r = '' } = t,
            a = ue(t, ['name', 'entity', 'attribute', 'unit'])
          let l
          const c = [n]
          return (
            s
              ? ((l = e.states[s]),
                c.push(
                  null === (i = null == l ? void 0 : l.attributes) ||
                    void 0 === i
                    ? void 0
                    : i.friendly_name
                ),
                o && (l = l.attributes[o]))
              : o &&
                o in this.entity.attributes &&
                ((l = this.entity.attributes[o]), c.push(o)),
            c.push(s),
            Object.assign(Object.assign({}, a), {
              name: c.find((e) => !!e),
              state: l,
              entity: s,
              unit: r,
            })
          )
        }))
  }
  render(
    { _hide: e, _values: t, _updatingValues: i, config: n, entity: s } = this
  ) {
    var o, r, a
    const l = []
    if (
      (this.stepSize < 1 &&
        0 === this.config.decimals &&
        l.push(
          I`<hui-warning>Decimals is set to 0 and step_size is lower than 1. Decrementing a setpoint will likely not work. Change one of the settings to clear this warning.</hui-warning>`
        ),
      !s)
    )
      return I`<hui-warning>Entity not available: ${n.entity}</hui-warning>`
    const {
        attributes: { min_temp: c = null, max_temp: d = null, hvac_action: h },
      } = s,
      u = this.getUnit(),
      p =
        null !==
          (a =
            null ===
              (r =
                null === (o = this.config) || void 0 === o
                  ? void 0
                  : o.layout) || void 0 === r
              ? void 0
              : r.step) && void 0 !== a
          ? a
          : 'column',
      f = 'row' === p,
      g = [
        !this.header && 'no-header',
        h,
        'modern' === this.config.theme ? 'modern' : 'standard',
        'modern' === this.config.theme && 'dial' === this.config.control_style
          ? 'style-dial'
          : 'style-classic',
      ].filter((e) => !!e)
    let m
    return (
      3 === this.config.version
        ? ((m = this.sensors
            .filter((e) => !1 !== e.show)
            .map((e) =>
              (function ({
                context: e,
                entityId: t,
                template: i = '{{state.text}}',
                label: n,
                hass: s,
                variables: o = {},
                config: r,
                localize: a,
                openEntityPopover: l,
              }) {
                var c, d
                const { state: h, attributes: u } = e,
                  [p] = t.split('.'),
                  f = s.selectedLanguage || s.language,
                  g = 'ui.card.climate.',
                  m = Object.entries(s.resources[f]).reduce(
                    (e, [t, i]) => (
                      t.startsWith(g) && (e[t.replace(g, '')] = i), e
                    ),
                    {}
                  ),
                  v = Object.assign(Object.assign({}, u), {
                    state: { raw: h, text: a(h, `component.${p}.state._.`) },
                    ui: m,
                    v: o,
                  })
                $e.filters.define(
                  'formatNumber',
                  (e, t = { decimals: r.decimals }) => String(we(e, t))
                ),
                  $e.filters.define(
                    'relativetime',
                    (e, t = {}) =>
                      `<ha-relative-time fwd-datetime=${e} with-hass></ha-relative-time>`
                  ),
                  $e.filters.define('translate', (e, t = '') =>
                    a(
                      e,
                      t || ('climate' !== p && 'humidifier' !== p)
                        ? t
                        : `state_attributes.${p}.${e}`
                    )
                  )
                const y = (e) => $e.render(e, v, { useWith: !0 }),
                  b = y(i)
                if (
                  !1 === n ||
                  !1 ===
                    (null ===
                      (d =
                        null === (c = null == r ? void 0 : r.layout) ||
                        void 0 === c
                          ? void 0
                          : c.sensors) || void 0 === d
                      ? void 0
                      : d.labels)
                )
                  return I`<div class="sensor-value">${Pe(b)}</div>`
                const _ = n || '{{friendly_name}}',
                  w = _.match(/^(mdi|hass):.*/) ? Ce(_) : y(_)
                return I`<div class="sensor-heading">${Pe(
                  w
                )}</div><div class="sensor-value">${Pe(b)}</div>`
              })(
                Object.assign(Object.assign({}, e), {
                  variables: this.config.variables,
                  hass: this._hass,
                  config: this.config,
                  localize: this.localize,
                  openEntityPopover: this.openEntityPopover,
                })
              )
            )),
          (m = Ee(this.config, m)))
        : (m = this.showSensors
            ? (function ({
                _hide: e,
                entity: t,
                unit: i,
                hass: n,
                sensors: s,
                config: o,
                localize: r,
                openEntityPopover: a,
              }) {
                var l, c, d, h, u, p, f
                const {
                    state: g,
                    attributes: { hvac_action: m, current_temperature: v },
                  } = t,
                  y =
                    null ===
                      (d =
                        null ===
                          (c =
                            null === (l = null == o ? void 0 : o.layout) ||
                            void 0 === l
                              ? void 0
                              : l.sensors) || void 0 === c
                          ? void 0
                          : c.labels) ||
                    void 0 === d ||
                    d
                let b = r(g, 'component.climate.state._.')
                return (
                  m &&
                    (b = [
                      r(m, 'state_attributes.climate.hvac_action.'),
                      ` (${b})`,
                    ].join('')),
                  Ee(
                    o,
                    [
                      je({
                        hide: e.temperature,
                        state: `${we(v, o)}${i || ''}`,
                        hass: n,
                        details: {
                          heading:
                            !!y &&
                            (null !==
                              (u =
                                null === (h = null == o ? void 0 : o.label) ||
                                void 0 === h
                                  ? void 0
                                  : h.temperature) && void 0 !== u
                              ? u
                              : r('ui.card.climate.currently')),
                        },
                      }),
                      je({
                        hide: e.state,
                        state: b,
                        hass: n,
                        details: {
                          heading:
                            !!y &&
                            (null !==
                              (f =
                                null === (p = null == o ? void 0 : o.label) ||
                                void 0 === p
                                  ? void 0
                                  : p.state) && void 0 !== f
                              ? f
                              : r(
                                  'ui.panel.lovelace.editor.card.generic.state'
                                )),
                        },
                      }),
                      ...(s.map((e) => {
                        var { name: t, state: i } = e,
                          s = ue(e, ['name', 'state'])
                        return je({
                          state: i,
                          hass: n,
                          localize: r,
                          openEntityPopover: a,
                          details: Object.assign(Object.assign({}, s), {
                            heading: y && t,
                          }),
                        })
                      }) || null),
                    ].filter((e) => null !== e)
                  )
                )
              })({
                _hide: this._hide,
                unit: u,
                hass: this._hass,
                entity: this.entity,
                sensors: this.sensors,
                config: this.config,
                localize: this.localize,
                openEntityPopover: this.openEntityPopover,
              })
            : ''),
      I`<ha-card class="${g.join(' ')}">${l} ${xe({
        header: this.header,
        toggleEntityChanged: this.toggleEntityChanged,
        entity: this.entity,
        openEntityPopover: this.openEntityPopover,
      })}<section class="body">${m} ${Object.entries(t).map(([e, t]) => {
        const s = ['string', 'number'].includes(typeof t),
          o = !1 !== u && s
        return I`<div class="current-wrapper ${p}"><ha-icon-button ?disabled="${
          null !== d && t >= d
        }" class="thermostat-trigger" icon="${f ? Le : Fe}" @click="${() =>
          this.setTemperature(this.stepSize, e)}"><ha-icon .icon="${
          f ? Le : Fe
        }"></ha-icon></ha-icon-button><h3 @click="${() =>
          this.openEntityPopover()}" class="current--value ${
          i ? 'updating' : v
        }">${we(t, n)} ${
          o ? I`<span class="current--unit">${u}</span>` : v
        }</h3><ha-icon-button ?disabled="${
          null !== c && t <= c
        }" class="thermostat-trigger" icon="${f ? qe : He}" @click="${() =>
          this.setTemperature(-this.stepSize, e)}"><ha-icon .icon="${
          f ? qe : He
        }"></ha-icon></ha-icon-button></div>`
      })}</section>${this.modes.map((e) => {
        var t, i, n
        return Te({
          state: s.state,
          mode: e,
          localize: this.localize,
          modeOptions:
            null !==
              (n =
                null ===
                  (i =
                    null === (t = this.config) || void 0 === t
                      ? void 0
                      : t.layout) || void 0 === i
                  ? void 0
                  : i.mode) && void 0 !== n
              ? n
              : {},
          setMode: this.setMode,
        })
      })}</ha-card>`
    )
  }
  setTemperature(e, t) {
    this._updatingValues = !0
    const i = this._values[t],
      n = Number(i) + e,
      { decimals: s } = this.config
    ;(this._values = Object.assign(Object.assign({}, this._values), {
      [t]: +we(n, { decimals: s }),
    })),
      this._debouncedSetTemperature(this._values)
  }
  getCardSize() {
    return 3
  }
  getUnit() {
    var e, t, i, n
    return ['boolean', 'string'].includes(typeof this.config.unit)
      ? null === (e = this.config) || void 0 === e
        ? void 0
        : e.unit
      : null !==
          (n =
            null ===
              (i =
                null === (t = this._hass.config) || void 0 === t
                  ? void 0
                  : t.unit_system) || void 0 === i
              ? void 0
              : i.temperature) &&
          void 0 !== n &&
          n
  }
}
pe([Y()], We.prototype, 'config', void 0),
  pe([Y()], We.prototype, 'header', void 0),
  pe([Y()], We.prototype, 'service', void 0),
  pe([Y()], We.prototype, 'modes', void 0),
  pe([Y()], We.prototype, 'entity', void 0),
  pe([Y()], We.prototype, 'sensors', void 0),
  pe([Y()], We.prototype, 'showSensors', void 0),
  pe([Y()], We.prototype, 'name', void 0),
  pe([Y({ type: Object })], We.prototype, '_values', void 0),
  pe([Y()], We.prototype, '_updatingValues', void 0),
  pe([Y()], We.prototype, '_hide', void 0),
  customElements.define(e, We),
  customElements.define(
    `${e}-editor`,
    class extends ee {
      static get styles() {
        return te
      }
      static get properties() {
        return { hass: {}, config: {} }
      }
      static getStubConfig() {
        return Object.assign({}, de)
      }
      setConfig(e) {
        this.config = e || Object.assign({}, de)
      }
      _openLink() {
        window.open(
          'https://github.com/nervetattoo/simple-thermostat/blob/master/README.md'
        )
      }
      render() {
        var e,
          t,
          i,
          n,
          s,
          o,
          r,
          a,
          l,
          c,
          d,
          h,
          u,
          p,
          f,
          g,
          m,
          v,
          y,
          b,
          _,
          w,
          x,
          S
        return this.hass
          ? I`<div class="card-config"><div class="overall-config"><div class="side-by-side"><ha-entity-picker label="Entity (required)" .hass="${
              this.hass
            }" .value="${
              this.config.entity
            }" .configValue="${'entity'}" .includeDomains="${ce}" @change="${
              this.valueChanged
            }" allow-custom-entity></ha-entity-picker></div><ha-formfield label="Show header?"><ha-switch .checked="${
              !1 !== this.config.header
            }" @change="${
              this.toggleHeader
            }"></ha-switch></ha-formfield><ha-formfield label="Show mode names?"><ha-switch .checked="${
              !1 !==
              (null ===
                (i =
                  null ===
                    (t =
                      null === (e = this.config) || void 0 === e
                        ? void 0
                        : e.layout) || void 0 === t
                    ? void 0
                    : t.mode) || void 0 === i
                ? void 0
                : i.names)
            }" .configValue="${'layout.mode.names'}" @change="${
              this.valueChanged
            }"></ha-switch></ha-formfield><ha-formfield label="Show mode icons?"><ha-switch .checked="${
              !1 !==
              (null ===
                (o =
                  null ===
                    (s =
                      null === (n = this.config) || void 0 === n
                        ? void 0
                        : n.layout) || void 0 === s
                    ? void 0
                    : s.mode) || void 0 === o
                ? void 0
                : o.icons)
            }" .configValue="${'layout.mode.icons'}" @change="${
              this.valueChanged
            }"></ha-switch></ha-formfield><ha-formfield label="Show mode headings?"><ha-switch .checked="${
              !1 !==
              (null ===
                (l =
                  null ===
                    (a =
                      null === (r = this.config) || void 0 === r
                        ? void 0
                        : r.layout) || void 0 === a
                    ? void 0
                    : a.mode) || void 0 === l
                ? void 0
                : l.headings)
            }" .configValue="${'layout.mode.headings'}" @change="${
              this.valueChanged
            }"></ha-switch></ha-formfield><ha-formfield label="Show HVAC modes?"><ha-switch .checked="${
              !1 !==
              (null ===
                (d =
                  null === (c = this.config) || void 0 === c
                    ? void 0
                    : c.control) || void 0 === d
                ? void 0
                : d.hvac)
            }" .configValue="${'control.hvac'}" @change="${
              this.valueChanged
            }"></ha-switch></ha-formfield><ha-formfield label="Show preset modes?"><ha-switch .checked="${
              !1 !==
              (null ===
                (u =
                  null === (h = this.config) || void 0 === h
                    ? void 0
                    : h.control) || void 0 === u
                ? void 0
                : u.preset)
            }" .configValue="${'control.preset'}" @change="${
              this.valueChanged
            }"></ha-switch></ha-formfield><div class="side-by-side"><ha-select label="Theme" .value="${
              this.config.theme || 'standard'
            }" @change="${(e) => this._selectChanged(e, 'theme')}" @closed="${(
              e
            ) =>
              e.stopPropagation()}" .fixedMenuPosition="${!0}" class="dropdown">${ae.map(
              (e) => I`<mwc-list-item .value="${e}">${e}</mwc-list-item>`
            )}</ha-select><ha-select label="Control Style" .value="${
              this.config.control_style || 'classic'
            }" @change="${(e) =>
              this._selectChanged(e, 'control_style')}" @closed="${(e) =>
              e.stopPropagation()}" .fixedMenuPosition="${!0}" class="dropdown">${le.map(
              (e) => I`<mwc-list-item .value="${e}">${e}</mwc-list-item>`
            )}</ha-select></div>${
              !1 !== this.config.header
                ? I`<div class="side-by-side"><ha-textfield label="Name (optional)" .value="${
                    (null === (p = this.config.header) || void 0 === p
                      ? void 0
                      : p.name) || ''
                  }" .configValue="${'header.name'}" @input="${
                    this.valueChanged
                  }"></ha-textfield><ha-icon-input label="Icon (optional)" .value="${
                    (null === (f = this.config.header) || void 0 === f
                      ? void 0
                      : f.icon) || ''
                  }" .configValue="${'header.icon'}" @value-changed="${
                    this.valueChanged
                  }"></ha-icon-input></div><div class="side-by-side"><ha-entity-picker label="Toggle Entity (optional)" .hass="${
                    this.hass
                  }" .value="${
                    null ===
                      (v =
                        null ===
                          (m =
                            null === (g = this.config) || void 0 === g
                              ? void 0
                              : g.header) || void 0 === m
                          ? void 0
                          : m.toggle) || void 0 === v
                      ? void 0
                      : v.entity
                  }" .configValue="${'header.toggle.entity'}" @change="${
                    this.valueChanged
                  }" allow-custom-entity></ha-entity-picker><ha-textfield label="Toggle entity label" .value="${
                    (null ===
                      (_ =
                        null ===
                          (b =
                            null === (y = this.config) || void 0 === y
                              ? void 0
                              : y.header) || void 0 === b
                          ? void 0
                          : b.toggle) || void 0 === _
                      ? void 0
                      : _.name) || ''
                  }" .configValue="${'header.toggle.name'}" @input="${
                    this.valueChanged
                  }"></ha-textfield></div>`
                : ''
            }<div class="side-by-side"><ha-textfield label="Fallback Text (optional)" .value="${
              this.config.fallback || ''
            }" .configValue="${'fallback'}" @input="${
              this.valueChanged
            }"></ha-textfield></div><div class="side-by-side"><ha-select label="Decimals" .value="${String(
              null !== (w = this.config.decimals) && void 0 !== w ? w : 1
            )}" @change="${(e) =>
              this._selectChanged(e, 'decimals')}" @closed="${(e) =>
              e.stopPropagation()}" .fixedMenuPosition="${!0}" class="dropdown">${Object.values(
              se
            ).map(
              (e) =>
                I`<mwc-list-item .value="${String(e)}">${e}</mwc-list-item>`
            )}</ha-select><ha-textfield label="Unit (optional)" .value="${
              this.config.unit || ''
            }" .configValue="${'unit'}" @input="${
              this.valueChanged
            }"></ha-textfield></div><div class="side-by-side"><ha-select label="Step Layout" .value="${
              (null === (x = this.config.layout) || void 0 === x
                ? void 0
                : x.step) || 'column'
            }" @change="${(e) =>
              this._selectChanged(e, 'layout.step')}" @closed="${(e) =>
              e.stopPropagation()}" .fixedMenuPosition="${!0}" class="dropdown">${Object.values(
              re
            ).map(
              (e) => I`<mwc-list-item .value="${e}">${e}</mwc-list-item>`
            )}</ha-select><ha-select label="Step Size" .value="${String(
              null !== (S = this.config.step_size) && void 0 !== S ? S : 0.5
            )}" @change="${(e) =>
              this._selectChanged(e, 'step_size')}" @closed="${(e) =>
              e.stopPropagation()}" .fixedMenuPosition="${!0}" class="dropdown">${Object.values(
              oe
            ).map(
              (e) =>
                I`<mwc-list-item .value="${String(e)}">${e}</mwc-list-item>`
            )}</ha-select></div><div class="side-by-side"><mwc-button @click="${
              this._openLink
            }">Configuration Options</mwc-button>Settings for label, control, sensors, faults and hiding UI elements can only be configured in the code editor</div></div></div>`
          : I``
      }
      _selectChanged(e, t) {
        if (!this.config || !this.hass) return
        const i = e.target.value
        if (null == i) return
        const n = he(this.config)
        ne(n, t, i), ie(this, 'config-changed', { config: n })
      }
      valueChanged(e) {
        if (!this.config || !this.hass) return
        const t = e.currentTarget || e.target,
          i = he(this.config)
        t.configValue &&
          ('' === t.value
            ? delete i[t.configValue]
            : ne(i, t.configValue, void 0 !== t.checked ? t.checked : t.value)),
          ie(this, 'config-changed', { config: i })
      }
      toggleHeader(e) {
        ;(this.config.header = !!e.target.checked && {}),
          ie(this, 'config-changed', { config: this.config })
      }
    }
  ),
  console.info(`%c${e}: 2.2.2`, 'font-weight: bold'),
  (window.customCards = window.customCards || []),
  window.customCards.push({
    type: e,
    name: 'Simple Thermostat Refresh',
    preview: !1,
    description: 'A different take on the thermostat card',
  })
