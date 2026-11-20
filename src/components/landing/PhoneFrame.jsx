/** Marco de celular para las maquetas del landing. Decorativo: el contenedor que lo usa lleva el texto alternativo. */
export default function PhoneFrame({ children, className = '', screenClassName = 'bg-mantel' }) {
  return (
    <div className={`rounded-[44px] bg-tinta p-[10px] shadow-[0_30px_80px_-30px_rgb(30_43_36/0.45)] ${className}`}>
      <div className={`relative h-full rounded-[34px] overflow-hidden ${screenClassName}`}>
        {children}
      </div>
    </div>
  );
}
