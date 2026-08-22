import { open } from "react-native-nitro-sqlite";

const db = open({
  name: "lysernfy.db",
});

export default db;