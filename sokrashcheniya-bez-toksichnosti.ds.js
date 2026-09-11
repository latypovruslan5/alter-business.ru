/* @ds-bundle: {"format":4,"namespace":"AlterDesignSystem_e92ee4","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"AudienceCard","sourcePath":"components/cards/AudienceCard.jsx"},{"name":"CaseCard","sourcePath":"components/cards/CaseCard.jsx"},{"name":"CtaBanner","sourcePath":"components/cards/CtaBanner.jsx"},{"name":"NumberedCard","sourcePath":"components/cards/NumberedCard.jsx"},{"name":"PricingCard","sourcePath":"components/cards/PricingCard.jsx"},{"name":"ProblemCard","sourcePath":"components/cards/ProblemCard.jsx"},{"name":"ServiceTile","sourcePath":"components/cards/ServiceTile.jsx"},{"name":"StatCard","sourcePath":"components/cards/StatCard.jsx"},{"name":"TestimonialCard","sourcePath":"components/cards/TestimonialCard.jsx"},{"name":"FaqItem","sourcePath":"components/data-display/FaqItem.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"Header","sourcePath":"components/navigation/Header.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"8b2f47d81294","components/cards/AudienceCard.jsx":"6118f73aea6a","components/cards/CaseCard.jsx":"2332f1e487c9","components/cards/CtaBanner.jsx":"e8250e763a95","components/cards/NumberedCard.jsx":"8768b21c163e","components/cards/PricingCard.jsx":"d691f125fe26","components/cards/ProblemCard.jsx":"2cea0f30b6d1","components/cards/ServiceTile.jsx":"2c448119d83e","components/cards/StatCard.jsx":"1547278414d9","components/cards/TestimonialCard.jsx":"8648980fd230","components/data-display/FaqItem.jsx":"f808f538fa5d","components/feedback/Badge.jsx":"a83a5510bba0","components/feedback/Modal.jsx":"2960cd6fcfa2","components/forms/Input.jsx":"2dfe19348819","components/forms/Select.jsx":"df6bee913350","components/navigation/Footer.jsx":"a8250207a98e","components/navigation/Header.jsx":"3b19f6f54a74"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AlterDesignSystem_e92ee4 = window.AlterDesignSystem_e92ee4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  md: {
    padding: '14px 28px',
    fontSize: 16
  },
  lg: {
    padding: '17px 44px',
    fontSize: 18
  },
  sm: {
    padding: '11px 22px',
    fontSize: 14
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
  style,
  ...rest
}) {
  const s = sizes[size] || sizes.md;
  const base = {
    fontFamily: "'Futura PT', sans-serif",
    fontWeight: 700,
    border: 'none',
    borderRadius: 'var(--radius-pill, 999px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'transform .2s, box-shadow .2s, background .18s, color .18s, border-color .18s',
    opacity: disabled ? 0.5 : 1,
    padding: s.padding,
    fontSize: s.fontSize,
    ...style
  };
  const variants = {
    primary: {
      background: '#239266',
      color: '#fff',
      boxShadow: '0 10px 28px rgba(35,146,102,0.3)'
    },
    secondary: {
      background: 'transparent',
      color: '#239266',
      border: '1.5px solid #29B981'
    },
    ghost: {
      background: '#F1F2F4',
      color: '#5A607A'
    },
    dark: {
      background: '#29B981',
      color: '#fff',
      boxShadow: '0 10px 26px rgba(41,185,129,0.34)'
    }
  };
  const combined = {
    ...base,
    ...variants[variant]
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onClick: disabled ? undefined : onClick,
    style: combined,
    onMouseEnter: e => {
      if (disabled) return;
      if (variant === 'primary' || variant === 'dark') {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 14px 34px rgba(35,146,102,0.4)';
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = '#239266';
        e.currentTarget.style.color = '#fff';
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = '#E4E6EA';
      }
    },
    onMouseLeave: e => {
      if (disabled) return;
      if (variant === 'primary' || variant === 'dark') {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = variants[variant].boxShadow;
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#239266';
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = '#F1F2F4';
      }
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/cards/AudienceCard.jsx
try { (() => {
function AudienceCard({
  title,
  description,
  shape
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg,#FBFCFB 0%,#F4F7F4 100%)',
      border: '1px solid #EEF1EE',
      borderRadius: 24,
      padding: '36px 32px 40px',
      height: '100%',
      boxSizing: 'border-box',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, shape && /*#__PURE__*/React.createElement("img", {
    src: shape,
    alt: "",
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: -18,
      right: -14,
      width: 108,
      height: 108,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 26,
      lineHeight: 1.2,
      color: '#282C3E',
      paddingRight: 84
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '18px 0 0',
      fontSize: 16,
      lineHeight: 1.6,
      color: '#5A607A'
    }
  }, description));
}
Object.assign(__ds_scope, { AudienceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/AudienceCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/CaseCard.jsx
try { (() => {
function CaseCard({
  company,
  badge,
  quote,
  actionLabel = 'Читать кейс',
  href = '#'
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: '#fff',
      border: '1px solid #ECEFEA',
      borderRadius: 24,
      padding: '28px 28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      height: '100%',
      boxSizing: 'border-box',
      fontFamily: "'Futura PT', sans-serif",
      transition: 'transform .22s ease, box-shadow .22s ease',
      transform: hover ? 'translateY(-4px)' : 'none',
      boxShadow: hover ? '0 16px 34px rgba(40,44,62,0.08)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 8,
      right: 18,
      fontFamily: "'Futura PT Cond', sans-serif",
      fontWeight: 700,
      fontSize: 110,
      lineHeight: 1,
      color: '#E7F3EC',
      pointerEvents: 'none',
      userSelect: 'none'
    }
  }, "\u201D"), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: 'flex-start',
      background: '#E7F3EC',
      color: '#1F6F52',
      borderRadius: 999,
      padding: '7px 16px',
      fontSize: 14,
      fontWeight: 500
    }
  }, badge), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 1.2,
      color: '#282C3E'
    }
  }, company), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: 1.55,
      color: '#4C516B',
      fontStyle: 'italic',
      flex: 1
    }
  }, quote), /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '13px 24px',
      borderRadius: 999,
      border: '1.5px solid #29B981',
      color: hover ? '#fff' : '#1F6F52',
      background: hover ? '#239266' : 'transparent',
      fontWeight: 700,
      fontSize: 16,
      textDecoration: 'none',
      transition: 'background .18s, color .18s'
    }
  }, actionLabel));
}
Object.assign(__ds_scope, { CaseCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CaseCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/CtaBanner.jsx
try { (() => {
function CtaBanner({
  variant = 'dark',
  eyebrow,
  title,
  description,
  actionLabel,
  href = '#',
  listTitle,
  items = []
}) {
  if (variant === 'light') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#F2F8F4',
        borderRadius: 28,
        padding: '40px 56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 48,
        flexWrap: 'wrap',
        fontFamily: "'Futura PT', sans-serif"
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        margin: 0,
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1.25,
        color: '#282C3E',
        maxWidth: 620
      }
    }, title), actionLabel && /*#__PURE__*/React.createElement("a", {
      href: href,
      style: {
        display: 'inline-flex',
        padding: '18px 40px',
        borderRadius: 999,
        background: '#239266',
        color: '#fff',
        fontWeight: 700,
        fontSize: 18,
        textDecoration: 'none',
        whiteSpace: 'nowrap'
      }
    }, actionLabel));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: '#282C3E',
      borderRadius: 32,
      padding: '56px 60px',
      display: 'grid',
      gridTemplateColumns: items.length ? '1.1fr 1fr' : '1fr',
      gap: 48,
      alignItems: 'center',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: -70,
      right: -60,
      width: 300,
      height: 300,
      borderRadius: '50%',
      background: 'rgba(41,185,129,0.12)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: '#9AA0B8',
      marginBottom: 22
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "'Futura PT Cond', sans-serif",
      fontWeight: 700,
      fontSize: 46,
      lineHeight: 1.08,
      color: '#fff'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '24px 0 0',
      fontSize: 17,
      lineHeight: 1.65,
      color: '#C5C9D8',
      maxWidth: 480
    }
  }, description), actionLabel && /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: 'inline-flex',
      marginTop: 34,
      padding: '18px 40px',
      borderRadius: 999,
      background: '#29B981',
      color: '#fff',
      fontWeight: 700,
      fontSize: 18,
      textDecoration: 'none',
      boxShadow: '0 14px 34px rgba(41,185,129,0.34)'
    }
  }, actionLabel)), items.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 24,
      padding: '32px 34px'
    }
  }, listTitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: '#9AA0B8',
      marginBottom: 20
    }
  }, listTitle), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      fontSize: 17,
      lineHeight: 1.45,
      color: '#EDEFF5'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: '#29B981',
      fontWeight: 700
    }
  }, "\u2713"), /*#__PURE__*/React.createElement("span", null, it))))));
}
Object.assign(__ds_scope, { CtaBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CtaBanner.jsx", error: String((e && e.message) || e) }); }

// components/cards/NumberedCard.jsx
try { (() => {
function NumberedCard({
  number,
  title,
  description,
  align = 'center',
  divider = false
}) {
  const centered = align === 'center';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: centered ? 'center' : 'flex-start',
      gap: 16,
      textAlign: centered ? 'center' : 'left',
      padding: '8px 28px',
      boxSizing: 'border-box',
      height: '100%',
      borderLeft: divider ? '1px solid #CFE5D9' : 'none',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: '#fff',
      color: '#1F6F52',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Futura PT Cond', sans-serif",
      fontWeight: 700,
      fontSize: 30
    }
  }, number), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 1.2,
      color: '#282C3E'
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: 1.6,
      color: '#5A607A'
    }
  }, description));
}
Object.assign(__ds_scope, { NumberedCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/NumberedCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PricingCard.jsx
try { (() => {
const {
  useState
} = React;
function PricingCard({
  name,
  dotColor,
  description,
  price,
  priceNote,
  rows = [],
  recommended = false,
  ctaLabel = 'Получить расчёт',
  onCta
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: '#fff',
      border: recommended ? '2px solid #29B981' : '1px solid #ECEFEA',
      borderRadius: 24,
      padding: 34,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      boxShadow: recommended ? hover ? '0 26px 54px rgba(35,146,102,0.22)' : '0 18px 44px rgba(35,146,102,0.12)' : hover ? '0 16px 34px rgba(40,44,62,0.1)' : 'none',
      transform: hover ? 'translateY(-4px)' : 'none',
      transition: 'transform .22s ease, box-shadow .22s ease',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, recommended && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -13,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#29B981',
      color: '#fff',
      fontWeight: 700,
      fontSize: 13,
      padding: '6px 16px',
      borderRadius: 30,
      whiteSpace: 'nowrap'
    }
  }, "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: dotColor,
      display: 'inline-block'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 22,
      color: '#282C3E'
    }
  }, name)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      color: '#6A7088',
      marginTop: 12,
      minHeight: 66
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Futura PT Cond', sans-serif",
      fontWeight: 800,
      fontSize: 40,
      color: recommended ? '#239266' : '#282C3E'
    }
  }, price), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: '#8A90A6',
      marginTop: 2
    }
  }, priceNote)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: '#F0F1F3',
      margin: '24px 0'
    }
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      flex: 1,
      margin: 0,
      padding: 0
    }
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#9197AC'
    }
  }, r.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: '#282C3E',
      marginTop: 2
    }
  }, r.value)))), /*#__PURE__*/React.createElement("button", {
    onClick: onCta,
    style: {
      marginTop: 28,
      textAlign: 'center',
      fontFamily: 'inherit',
      cursor: 'pointer',
      border: recommended ? 'none' : '1.5px solid #CDEBDD',
      background: recommended ? '#239266' : 'transparent',
      color: recommended ? '#fff' : '#239266',
      fontWeight: 700,
      fontSize: 16,
      padding: 14,
      borderRadius: 44,
      boxShadow: recommended ? '0 8px 22px rgba(35,146,102,0.28)' : 'none'
    }
  }, ctaLabel));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/ProblemCard.jsx
try { (() => {
function ProblemCard({
  number,
  title,
  description,
  icon,
  iconBg = '#E7F3EC',
  numberColor = '#DCEFE5',
  linkLabel = 'Подробнее',
  href = '#'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg,#FFFFFF 0%,#FAFBFA 100%)',
      border: '1px solid #ECEFEA',
      borderRadius: 24,
      padding: '32px 32px 30px',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      fontFamily: "'Futura PT', sans-serif"
    }
  }, number && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      top: 18,
      right: 26,
      fontFamily: "'Futura PT Cond', sans-serif",
      fontWeight: 700,
      fontSize: 64,
      lineHeight: 1,
      color: numberColor,
      pointerEvents: 'none'
    }
  }, number), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'flex-start',
      paddingRight: 72
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 0 auto',
      width: 56,
      height: 56,
      borderRadius: 16,
      background: iconBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, typeof icon === 'string' ? /*#__PURE__*/React.createElement("img", {
    src: icon,
    alt: "",
    style: {
      width: 28,
      height: 28
    }
  }) : icon), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 22,
      lineHeight: 1.25,
      color: '#282C3E'
    }
  }, title)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: 1.6,
      color: '#5A607A',
      flex: 1
    }
  }, description), linkLabel && /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      alignSelf: 'flex-start',
      color: '#1F6F52',
      fontSize: 16,
      fontWeight: 500,
      textDecoration: 'underline',
      textUnderlineOffset: 4
    }
  }, linkLabel));
}
Object.assign(__ds_scope, { ProblemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ProblemCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/ServiceTile.jsx
try { (() => {
function ServiceTile({
  title,
  description,
  icon,
  iconBg = '#E7F3EC',
  badge,
  href = '#'
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      padding: '32px 34px 36px',
      height: '100%',
      boxSizing: 'border-box',
      textDecoration: 'none',
      background: hover ? '#FAFCFA' : '#fff',
      transition: 'background .18s',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      background: iconBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, typeof icon === 'string' ? /*#__PURE__*/React.createElement("img", {
    src: icon,
    alt: "",
    style: {
      width: 28,
      height: 28
    }
  }) : icon), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: '1.5px solid #CFE5D9',
      color: '#239266',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 17,
      transition: 'transform .2s ease, border-color .2s',
      transform: hover ? 'translate(3px,-3px)' : 'none',
      borderColor: hover ? '#29B981' : '#CFE5D9'
    }
  }, "\u2197")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 22,
      lineHeight: 1.25,
      color: '#282C3E'
    }
  }, title), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      background: '#29B981',
      color: '#fff',
      borderRadius: 999,
      padding: '5px 12px',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: 'uppercase'
    }
  }, badge)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 16,
      lineHeight: 1.6,
      color: '#5A607A'
    }
  }, description));
}
Object.assign(__ds_scope, { ServiceTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/ServiceTile.jsx", error: String((e && e.message) || e) }); }

// components/cards/StatCard.jsx
try { (() => {
function StatCard({
  value,
  label,
  description,
  accentColor = '#239266',
  tint = false,
  dark = false
}) {
  const bg = dark ? '#282C3E' : tint ? '#EAF7F0' : 'linear-gradient(180deg,#FBFCFB 0%,#F5F8F5 100%)';
  const border = dark ? 'none' : tint ? '1px solid #D5EBE0' : '1px solid #ECEFEA';
  const labelColor = dark ? '#53C99B' : accentColor;
  const textColor = dark ? '#fff' : '#282C3E';
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: bg,
      border,
      borderRadius: 24,
      padding: '36px 32px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform .22s ease, box-shadow .22s ease',
      transform: hover ? 'translateY(-4px)' : 'none',
      boxShadow: hover ? '0 16px 34px rgba(40,44,62,0.08)' : 'none',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, !dark && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -46,
      right: -46,
      width: 150,
      height: 150,
      borderRadius: '50%',
      background: 'rgba(35,146,102,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Futura PT Cond', sans-serif",
      fontWeight: 700,
      fontSize: 48,
      color: accentColor,
      lineHeight: 1,
      letterSpacing: -1,
      whiteSpace: 'nowrap'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      lineHeight: 1.45,
      color: textColor,
      fontWeight: 700,
      marginTop: 18,
      minHeight: 60
    }
  }, label), description && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.5,
      color: dark ? '#C5C9D8' : '#6A7088',
      marginTop: 10
    }
  }, description));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/TestimonialCard.jsx
try { (() => {
function TestimonialCard({
  avatar,
  role,
  title,
  body
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid #ECEFEA',
      borderRadius: 28,
      padding: 48,
      display: 'grid',
      gridTemplateColumns: '190px 1fr',
      gap: 40,
      alignItems: 'start',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, avatar, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: '#6A7088',
      lineHeight: 1.4,
      marginTop: 16
    }
  }, role)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontWeight: 700,
      fontSize: 24,
      lineHeight: 1.3,
      color: '#282C3E',
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.6,
      color: '#4C516B',
      marginTop: 18,
      whiteSpace: 'pre-line'
    }
  }, body)));
}
Object.assign(__ds_scope, { TestimonialCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/TestimonialCard.jsx", error: String((e && e.message) || e) }); }

// components/data-display/FaqItem.jsx
try { (() => {
const {
  useState
} = React;
function FaqItem({
  question,
  answer,
  defaultOpen = false
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid #ECEFEA',
      borderRadius: 16,
      overflow: 'hidden',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20,
      padding: '22px 26px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700,
      fontSize: 18,
      color: '#282C3E'
    }
  }, question), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: '#29B981',
      color: '#fff',
      fontSize: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, open ? '−' : '+')), open && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      color: '#4C516B',
      padding: '0 26px 24px',
      margin: 0
    }
  }, answer));
}
Object.assign(__ds_scope, { FaqItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/FaqItem.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function Badge({
  variant = 'tint',
  children
}) {
  const styles = {
    tint: {
      background: '#EAF7F0',
      color: '#239266',
      fontWeight: 700,
      border: 'none'
    },
    outline: {
      background: 'transparent',
      color: '#239266',
      fontWeight: 400,
      border: '1px solid #A1E1C8'
    },
    chip: {
      background: '#F4F5F7',
      color: '#5A607A',
      fontWeight: 600,
      border: 'none'
    },
    solid: {
      background: '#29B981',
      color: '#fff',
      fontWeight: 700,
      border: 'none'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      fontFamily: "'Futura PT', sans-serif",
      fontSize: variant === 'outline' ? 13 : 14,
      padding: variant === 'outline' ? '5px 12px' : '7px 16px',
      borderRadius: 30,
      ...styles[variant]
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function Modal({
  open,
  onClose,
  children,
  maxWidth = 640
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'rgba(20,24,34,0.55)',
      backdropFilter: 'blur(4px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'relative',
      background: '#fff',
      borderRadius: 26,
      maxWidth,
      width: '100%',
      padding: 44,
      boxShadow: '0 30px 80px rgba(20,24,34,0.35)',
      maxHeight: '88vh',
      overflowY: 'auto',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    style: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 36,
      height: 36,
      border: 'none',
      borderRadius: '50%',
      background: '#F1F2F4',
      color: '#4C516B',
      fontSize: 20,
      lineHeight: 1,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "\xD7"), children));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function Input({
  placeholder,
  type = 'text',
  value,
  onChange,
  required = false,
  style,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    required: required,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    onFocus: e => {
      setFocused(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur && rest.onBlur(e);
    },
    style: {
      fontFamily: "'Futura PT', sans-serif",
      fontSize: 16,
      padding: '17px 20px',
      width: '100%',
      boxSizing: 'border-box',
      border: focused ? '1px solid #29B981' : '1px solid #DCE5DF',
      borderRadius: 14,
      outline: 'none',
      color: '#282C3E',
      background: '#fff',
      boxShadow: focused ? '0 0 0 4px rgba(41,185,129,0.13)' : 'none',
      transition: 'border-color .18s, box-shadow .18s',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  options = [],
  placeholder,
  value,
  onChange,
  required = false,
  style
}) {
  return /*#__PURE__*/React.createElement("select", {
    required: required,
    value: value,
    onChange: onChange,
    style: {
      fontFamily: "'Futura PT', sans-serif",
      fontSize: 16,
      padding: '17px 44px 17px 20px',
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid #DCE5DF',
      borderRadius: 14,
      outline: 'none',
      color: value ? '#282C3E' : '#6A7088',
      background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236A7088' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 18px center",
      appearance: 'none',
      WebkitAppearance: 'none',
      transition: 'border-color .18s, box-shadow .18s',
      ...style
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, placeholder), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o)));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
function Footer({
  columns = [],
  email = 'business@alter.ru',
  logoSrc = 'assets/logo.svg'
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: '#282C3E',
      color: '#fff',
      marginTop: 60
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '64px 40px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
      gap: 40,
      paddingBottom: 48,
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "Alter",
    style: {
      height: 28,
      width: 'auto',
      filter: 'brightness(0) invert(1)'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.55,
      color: '#9AA0B5',
      marginTop: 16,
      maxWidth: 280
    }
  }, "\u041A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0430\u044F \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0441 \u043D\u0430\u0443\u0447\u043D\u044B\u043C \u043F\u043E\u0434\u0445\u043E\u0434\u043E\u043C \u0434\u043B\u044F \u0443\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u044F \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432.")), columns.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.title,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 15
    }
  }, col.title), col.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href,
    style: {
      fontSize: 15,
      color: '#9AA0B5',
      textDecoration: 'none'
    }
  }, l.label))))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 26,
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: '#717892'
    }
  }, "\xA9 2026 Alter. \u0412\u0441\u0435 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B."), /*#__PURE__*/React.createElement("a", {
    href: `mailto:${email}`,
    style: {
      fontSize: 14,
      color: '#717892',
      textDecoration: 'none'
    }
  }, email))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Header.jsx
try { (() => {
function Header({
  links = [],
  ctaLabel = 'Заказать демо',
  onCta,
  logoSrc = 'assets/logo.svg'
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 60,
      background: 'rgba(251,252,251,0.85)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(40,44,62,0.07)'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '16px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#top",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "Alter",
    style: {
      height: 28,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 17,
      background: 'rgba(40,44,62,0.18)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: '#6A7088'
    }
  }, "\u0434\u043B\u044F \u0431\u0438\u0437\u043D\u0435\u0441\u0430")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l.label,
    href: l.href,
    style: {
      fontSize: 15,
      color: '#3A3F58',
      textDecoration: 'none'
    }
  }, l.label))), /*#__PURE__*/React.createElement("button", {
    onClick: onCta,
    style: {
      background: '#239266',
      color: '#fff',
      fontWeight: 700,
      fontSize: 15,
      padding: '12px 24px',
      borderRadius: 44,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 10px 28px rgba(35,146,102,0.3)',
      fontFamily: "'Futura PT', sans-serif"
    }
  }, ctaLabel)));
}
Object.assign(__ds_scope, { Header });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Header.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.AudienceCard = __ds_scope.AudienceCard;

__ds_ns.CaseCard = __ds_scope.CaseCard;

__ds_ns.CtaBanner = __ds_scope.CtaBanner;

__ds_ns.NumberedCard = __ds_scope.NumberedCard;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.ProblemCard = __ds_scope.ProblemCard;

__ds_ns.ServiceTile = __ds_scope.ServiceTile;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.TestimonialCard = __ds_scope.TestimonialCard;

__ds_ns.FaqItem = __ds_scope.FaqItem;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.Header = __ds_scope.Header;

})();
