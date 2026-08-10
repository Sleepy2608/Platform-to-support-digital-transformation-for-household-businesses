package com.hbdt.seed;

public interface DataSeeder {

    default int order() {
        return 100;
    }

    default String name() {
        return getClass().getSimpleName();
    }

    void seed();
}
