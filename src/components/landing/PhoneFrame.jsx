/** Marco de celular para las maquetas del landing. Decorativo: el contenedor que lo usa lleva el texto alternativo. */
export default function PhoneFrame({ children, className = '', screenClassName = 'bg-mantel' }) {
  return (
    <div className={`rounded-[44px] bg-tinta p-[10px] shadow-[0_30px_80px_-30px_rgb(30_43_36/0.45)] ${className}`}>
      <div className={`relative h-full rounded-[34px] overflow-hidden ${screenClassName}`}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-tinta" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
