export default function UppercaseFirstOnly(str: string) {
  return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}
