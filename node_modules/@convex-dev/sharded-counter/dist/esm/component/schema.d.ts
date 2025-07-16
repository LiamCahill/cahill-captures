declare const _default: import("convex/server").SchemaDefinition<{
    counters: import("convex/server").TableDefinition<import("convex/values").VObject<{
        name: string;
        value: number;
        shard: number;
    }, {
        name: import("convex/values").VString<string, "required">;
        value: import("convex/values").VFloat64<number, "required">;
        shard: import("convex/values").VFloat64<number, "required">;
    }, "required", "name" | "value" | "shard">, {
        name: ["name", "shard", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map